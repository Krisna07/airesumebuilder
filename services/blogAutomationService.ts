/**
 * Blog Automation Service (Refactored)
 * 
 * Handles automated blog generation, publishing, and content refresh workflows.
 * Leverages AIService for all AI operations.
 */

import { nanoid } from 'nanoid'
import { parseResponse } from '@/lib/jsonParse'
import { generateBlogTitlePlanPrompt, generateSeoBlogPrompt, regenerateBlogPrompt } from '@/lib/prompts'
import { prisma } from '@/lib/prisma'
import sanityClient from '@/lib/sanity'
import { createBlog, getBlogById, normalizeSlug, updateBlog, saveImage } from '@/services/blogCmsService'
import { generateBlogCoverImage } from '@/services/imageGenerationService'
import { callAIWithSchema } from '@/services/aiServices'
import { blogGenerationSchema, blogTitlePlanSchema, blogRegenerationSchema } from '@/lib/aiSchemas'
import type { BlogActor, BlogSection, BlogStatus, CreateBlogInput } from '@/types/blog'

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface SanityBlogDoc {
  _id: string
  title: string
  slug?: { current?: string }
  author: string
  seoKeywords?: string[]
  sections: BlogSection[]
  createdAt: string
  publishedAt?: string
  updatedAt: string
}

type GeneratedBlogDraft = {
  title: string
  excerpt: string
  slug?: string
  imagePrompt: string
  seoKeywords?: string[]
  sections: BlogSection[]
  status: BlogStatus
  author: string
}

type TitlePlanResult = {
  title: string
  targetKeywords: string[]
}

type ExistingTitleIndex = {
  titles: string[]
  blockedKeys: Set<string>
  crmKeywords: string[]
}

export type BlogAutomationResult = {
  success: boolean
  state: 'created' | 'skipped'
  reason?: string
  title: string
  slug?: string
  blogId?: string
  traceId: string
  durationMs: number
}

export type ContentRefreshResult = {
  success: boolean
  state: 'refreshed' | 'skipped' | 'error'
  reason?: string
  postId?: string
  postTitle?: string
  oldAgeDays?: number
  newUpdatedAt?: string
  durationMs: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration & Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCronActor(): BlogActor {
  return {
    userId: process.env.BLOG_CRON_ACTOR_ID || 'cron-system',
    email: process.env.BLOG_CRON_ACTOR_EMAIL || 'cron@system.local',
  }
}

function getRefreshActor(): BlogActor {
  return {
    userId: process.env.BLOG_REFRESH_AUTHOR_ID || 'cron-refresh',
    email: process.env.BLOG_REFRESH_AUTHOR_EMAIL || 'refresh@system.local',
  }
}

function getDefaultAuthor(): string {
  return process.env.BLOG_CRON_AUTHOR || 'ResumeCraft Team'
}

function getDefaultStatus(): BlogStatus {
  const status = (process.env.BLOG_CRON_DEFAULT_STATUS || 'published').toLowerCase()
  return (status === 'draft' || status === 'archived') ? status : 'published'
}

function toBoolean(value?: string | null): boolean {
  return value ? ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()) : false
}

/**
 * Parse comma/newline/pipe-delimited list from environment variable
 */
function parseList(value?: string): string[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  } catch {
    // fallback to delimiter parsing
  }

  return value
    .split(/\r?\n|\|/,)
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Get next blog title from queue or generate from keyword
 */
function selectNextBlogTitle(): string {
  const titles = parseList(process.env.BLOG_CRON_TITLES)
  if (titles.length > 0) {
    const bucket = Math.floor(Date.now() / (60 * 60 * 1000))
    return titles[bucket % titles.length]
  }

  const keywords = parseList(process.env.BLOG_CRON_KEYWORDS)
  const keyword = keywords.length > 0
    ? keywords[Math.floor(Date.now() / (60 * 60 * 1000)) % keywords.length]
    : 'resume writing'

  const templates = [
    'Practical ${keyword} tips that improve interview callbacks',
    'A modern guide to ${keyword} in 2026',
    'Common ${keyword} mistakes and how to avoid them',
    'How recruiters evaluate ${keyword} and what to optimize',
  ]

  const template = templates[Math.floor(Date.now() / (60 * 60 * 1000)) % templates.length]
  return template.replace('${keyword}', keyword)
}

/**
 * Normalize title for uniqueness checking
 */
function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Clean title candidates from AI output (remove quotes, extra spaces)
 */
function cleanCandidateTitle(value: string): string {
  return value.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '').replace(/\s+/g, ' ')
}

function titleTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function titleFingerprint(value: string): string {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'how', 'why', 'are', '2026', '2027', 'guide',
  ])

  return titleTokens(value)
    .filter((token) => !stopwords.has(token))
    .slice(0, 5)
    .join('|')
}

function titleSimilarityScore(a: string, b: string): number {
  const aSet = new Set(titleTokens(a))
  const bSet = new Set(titleTokens(b))
  if (aSet.size === 0 || bSet.size === 0) return 0

  let intersection = 0
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1
  }

  const union = new Set([...aSet, ...bSet]).size
  return union > 0 ? intersection / union : 0
}

function includesKeywordHint(title: string, keywordPool: string[]): boolean {
  const normalizedTitle = title.toLowerCase()
  return keywordPool.some((kw) => {
    const key = kw.trim().toLowerCase()
    return key.length >= 3 && normalizedTitle.includes(key)
  })
}

function buildAppKeywordPool(resumeContext: Record<string, unknown>, crmKeywords: string[]): string[] {
  const defaults = [
    'resume',
    'ats',
    'job search',
    'interview',
    'cover letter',
    'linkedin',
    'career',
  ]

  const resumeRoleKeywords = Array.isArray(resumeContext.roleKeywords)
    ? resumeContext.roleKeywords.filter((v): v is string => typeof v === 'string')
    : []

  const resumeSkills = Array.isArray(resumeContext.topSkills)
    ? resumeContext.topSkills.filter((v): v is string => typeof v === 'string').slice(0, 10)
    : []

  return uniqueStrings([...defaults, ...resumeRoleKeywords, ...resumeSkills, ...crmKeywords], 24)
}

/**
 * Return unique strings up to max count
 */
function uniqueStrings(values: string[], max = 20): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const item = value.trim()
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
    if (result.length >= max) break
  }

  return result
}

/**
 * Cast to object safely
 */
function asObject(value: unknown): Record<string, unknown> {
  return (value && typeof value === 'object' && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Cast to array safely
 */
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume Context Building
// ─────────────────────────────────────────────────────────────────────────────

async function buildResumeContextForTitlePlanning() {
  const latestResume = await prisma.resume.findFirst({
    where: { deleted: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      title: true,
      profile: true,
      experiences: true,
      educations: true,
      skills: true,
      customSections: true,
      updatedAt: true,
    },
  })

  if (!latestResume) {
    return {
      resumeTitle: 'General resume improvement',
      summary: '',
      primaryRole: '',
      roleKeywords: parseList(process.env.BLOG_CRON_KEYWORDS).slice(0, 10),
      topSkills: [],
      companies: [],
      education: [],
      customTopics: [],
    }
  }

  const profile = asObject(latestResume.profile)
  const experiences = asArray(latestResume.experiences).map(asObject)
  const educations = asArray(latestResume.educations).map(asObject)
  const skillGroups = asArray(latestResume.skills).map(asObject)
  const customSections = asArray(latestResume.customSections).map(asObject)

  const primaryRole = (experiences
    .map((item) => item.title)
    .find((item): item is string => typeof item === 'string')) || latestResume.title

  const roleKeywords = uniqueStrings(
    experiences
      .map((item) => item.title)
      .filter((item): item is string => typeof item === 'string')
      .concat(primaryRole || '')
  )

  const topSkills = uniqueStrings(
    skillGroups.flatMap((group) => {
      const skills = asArray(group.skills)
      return skills.filter((item): item is string => typeof item === 'string')
    }),
    18
  )

  const companies = uniqueStrings(
    experiences
      .map((item) => item.company)
      .filter((item): item is string => typeof item === 'string'),
    10
  )

  const education = uniqueStrings(
    educations
      .flatMap((item) => [item.degree, item.university])
      .filter((item): item is string => typeof item === 'string'),
    10
  )

  const customTopics = uniqueStrings(
    customSections
      .map((item) => item.title)
      .filter((item): item is string => typeof item === 'string'),
    10
  )

  const summary = typeof profile.summary === 'string' ? profile.summary.slice(0, 500) : ''

  return {
    resumeTitle: latestResume.title,
    summary,
    primaryRole: primaryRole || '',
    roleKeywords,
    topSkills,
    companies,
    education,
    customTopics,
    updatedAt: latestResume.updatedAt.toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Title Planning & Deduplication
// ─────────────────────────────────────────────────────────────────────────────

async function getExistingBlogTitleIndex(): Promise<ExistingTitleIndex> {
  const limit = Math.max(Number(process.env.BLOG_TITLE_LOOKBACK_LIMIT || 500), 100)
  const docs = await sanityClient.fetch<Array<{ title?: string; slug?: { current?: string }; seoKeywords?: string[] }>>(
    '*[_type == "blog"] | order(coalesce(publishedAt, createdAt) desc)[0...$limit]{title,slug,seoKeywords}',
    { limit }
  )

  const titles = docs
    .map((item) => (typeof item.title === 'string' ? item.title.trim() : ''))
    .filter(Boolean)

  const blockedKeys = new Set<string>()
  for (const title of titles) {
    blockedKeys.add(normalizeTitleKey(title))
    blockedKeys.add(normalizeSlug(title))
  }

  const crmKeywords = uniqueStrings(
    docs.flatMap((doc) => (Array.isArray(doc.seoKeywords) ? doc.seoKeywords : [])),
    30
  )

  return { titles, blockedKeys, crmKeywords }
}

async function isTitleOrSlugUsed(title: string, slug: string): Promise<boolean> {
  const count = await sanityClient.fetch<number>(
    'count(*[_type == "blog" && (title == $title || slug.current == $slug)])',
    { title, slug }
  )
  return count > 0
}

/**
 * Parse blog title and keywords from AI response
 */
function parseTitlePlanFromAi(raw: unknown): TitlePlanResult {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')

  try {
    const parsed = parseResponse(text)
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      const titleCandidate = obj.title
      const keywordsCandidate = obj.targetKeywords

      if (typeof titleCandidate === 'string' && titleCandidate.trim()) {
        return {
          title: cleanCandidateTitle(titleCandidate),
          targetKeywords: Array.isArray(keywordsCandidate)
            ? keywordsCandidate.filter((k): k is string => typeof k === 'string')
            : [],
        }
      }
    }
  } catch {
    // fallback to plain text
  }

  const firstLine = text.split(/\r?\n/).find((line) => line.trim())
  return {
    title: firstLine ? cleanCandidateTitle(firstLine) : '',
    targetKeywords: [],
  }
}

/**
 * Generate a unique blog title with AI assistance and fallback
 */
export async function planUniqueTitleFromResume(
  preferredTitle?: string
): Promise<TitlePlanResult> {
  const [resumeContext, existing] = await Promise.all([
    buildResumeContextForTitlePlanning(),
    getExistingBlogTitleIndex(),
  ])

  const blocked = new Set<string>(existing.blockedKeys)
  const blockedFingerprints = new Set(existing.titles.map((t) => titleFingerprint(t)).filter(Boolean))
  const appKeywordPool = buildAppKeywordPool(resumeContext as Record<string, unknown>, existing.crmKeywords)

  // If preferred title provided, check if available
  if (preferredTitle?.trim()) {
    const given = cleanCandidateTitle(preferredTitle)
    const givenSlug = normalizeSlug(given)
    const used =
      blocked.has(normalizeTitleKey(given)) ||
      blocked.has(givenSlug) ||
      (await isTitleOrSlugUsed(given, givenSlug))

    if (!used) {
      return { title: given, targetKeywords: [] }
    }

    blocked.add(normalizeTitleKey(given))
    blocked.add(givenSlug)
  }

  // Try AI-generated titles with retry
  const retryCount = Math.max(Number(process.env.BLOG_TITLE_GEN_RETRIES || 5), 2)

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const prompt = generateBlogTitlePlanPrompt({
        resumeContext,
        existingTitles: existing.titles.slice(0, 220),
        blockedTitles: Array.from(blocked).slice(-120),
        appKeywords: appKeywordPool,
        crmKeywords: existing.crmKeywords.slice(0, 30),
        attempt,
      })

      const aiResponse = await callAIWithSchema(prompt, blogTitlePlanSchema, 'blog-title-generation')
      const result = parseTitlePlanFromAi(aiResponse)

      if (!result.title) continue

      const slug = normalizeSlug(result.title)
      const key = normalizeTitleKey(result.title)
      const fingerprint = titleFingerprint(result.title)
      const isKeywordRelevant = includesKeywordHint(result.title, appKeywordPool)
      const isNearDuplicate = existing.titles.some((t) => titleSimilarityScore(result.title, t) >= 0.72)

      const used =
        blocked.has(key) ||
        blocked.has(slug) ||
        blockedFingerprints.has(fingerprint) ||
        isNearDuplicate ||
        !isKeywordRelevant ||
        (await isTitleOrSlugUsed(result.title, slug))

      if (used) {
        blocked.add(key)
        blocked.add(slug)
        if (fingerprint) blockedFingerprints.add(fingerprint)
        continue
      }

      const normalizedKeywords = uniqueStrings(
        (result.targetKeywords || []).concat(appKeywordPool.slice(0, 6)),
        10
      )

      return { title: result.title, targetKeywords: normalizedKeywords }
    } catch (err) {
      console.warn(`Title generation attempt ${attempt} failed:`, err)
      continue
    }
  }

  // Fallback to formula-based title
  const fallbackBase = resumeContext.primaryRole
    ? `Resume tips for ${resumeContext.primaryRole} professionals`
    : selectNextBlogTitle()

  for (let i = 0; i < 20; i += 1) {
    const candidate =
      i === 0
        ? fallbackBase
        : `${fallbackBase} ${new Date().getUTCFullYear()} edition ${i + 1}`

    const slug = normalizeSlug(candidate)
    const key = normalizeTitleKey(candidate)
    const used = blocked.has(key) || blocked.has(slug) || (await isTitleOrSlugUsed(candidate, slug))

    if (!used) {
      return { title: candidate, targetKeywords: [] }
    }
  }

  // Last resort: timestamp-based
  return { title: `${fallbackBase} ${Date.now()}`, targetKeywords: [] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog Draft Generation & Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and normalize AI blog output
 */
function validateAndNormalizeBlogDraft(
  raw: unknown,
  fallbackAuthor?: string
): GeneratedBlogDraft {
  const payload = typeof raw === 'string' ? parseResponse(raw) : raw

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid blog output: not an object')
  }

  const obj = payload as Record<string, unknown>

  // Validate required fields
  if (typeof obj.title !== 'string' || obj.title.length < 3) {
    throw new Error('Blog output must have a valid title (min 3 chars)')
  }

  if (typeof obj.excerpt !== 'string' || obj.excerpt.length < 10) {
    throw new Error('Blog output must have a valid excerpt (min 10 chars)')
  }

  if (typeof obj.imagePrompt !== 'string' || obj.imagePrompt.length < 5) {
    throw new Error('Blog output must have a valid imagePrompt (min 5 chars)')
  }

  if (!Array.isArray(obj.sections) || obj.sections.length < 2) {
    throw new Error('Blog output must have at least 2 sections')
  }

  const sections = (obj.sections as any[]).map((s) => ({
    ...s,
    id: s.id || `sec_${nanoid(8)}`,
  })) as BlogSection[]

  return {
    title: obj.title,
    excerpt: obj.excerpt,
    slug: typeof obj.slug === 'string' ? obj.slug : undefined,
    imagePrompt: obj.imagePrompt,
    seoKeywords: Array.isArray(obj.seoKeywords)
      ? (obj.seoKeywords as string[])
      : [],
    sections,
    status: (obj.status === 'draft' || obj.status === 'archived' ? obj.status : getDefaultStatus()) as BlogStatus,
    author: typeof obj.author === 'string' ? obj.author : (fallbackAuthor || getDefaultAuthor()),
  }
}

/**
 * Generate blog content from title and keywords
 */
export async function generateBlogDraftFromTitle(
  title: string,
  targetKeywords: string[] = []
): Promise<GeneratedBlogDraft> {
  const author = getDefaultAuthor()
  const prompt = generateSeoBlogPrompt(title, author, targetKeywords)

  const rawResponse = await callAIWithSchema(prompt, blogGenerationSchema, 'blog-content-generation')

  const parsed = typeof rawResponse === 'string' ? parseResponse(rawResponse) : rawResponse
  const draft = validateAndNormalizeBlogDraft(parsed, author)

  // Override title from planner to avoid drift
  draft.title = title
  draft.slug = normalizeSlug(title)

  return draft
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Regeneration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Regenerate blog content sections while preserving metadata
 */
export async function regenerateBlogContent(
  title: string,
  currentSections: BlogSection[],
  modificationPrompt: string
): Promise<BlogSection[]> {
// Convert sections to text summary
  const currentText = currentSections
    .map((s) => {
      if (s.type === 'paragraph') return s.content
      if (s.type === 'heading') return `${'#'.repeat(s.level)} ${s.content}`
      if (s.type === 'list') return s.items.map((it) => `- ${it}`).join('\n')
      if (s.type === 'quote') return `> ${s.content}`
      return ''
    })
    .join('\n\n')

  const prompt = regenerateBlogPrompt(title, currentText, modificationPrompt)
  const response = await callAIWithSchema(prompt, blogRegenerationSchema, 'blog-content-generation')

  if (!response || typeof response !== 'object' || !Array.isArray((response as any).sections)) {
    throw new Error('AI regeneration returned invalid format')
  }

  const sections = ((response as any).sections as any[]).map((s) => ({
    ...s,
    id: s.id || `sec_${nanoid(8)}`,
  })) as BlogSection[]

  return sections
}

/**
 * Backward-compatible single-post refresh helper used by test scripts.
 */
export async function refreshOldBlogPost(postId: string, actor: BlogActor) {
  const post = await getBlogById(postId)
  if (!post) {
    throw new Error(`Blog post not found: ${postId}`)
  }

  const modificationPrompt =
    'Update content to reflect current best practices and trends. Maintain structure and tone while refreshing examples and guidance.'

  const newSections = await regenerateBlogContent(post.title, post.sections || [], modificationPrompt)
  const updatedPost = await updateBlog(postId, { sections: newSections })

  if (!updatedPost) {
    throw new Error(`Blog post not found during update: ${postId}`)
  }

  console.log(`[blog/refresh] Refreshed post ${postId} by ${actor.email}`)
  return updatedPost
}

// ─────────────────────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publish a generated blog draft with image
 */
export async function publishGeneratedBlog(
  draft: GeneratedBlogDraft,
  actor = getCronActor()
) {
  const generatedImage = await generateBlogCoverImage(draft.imagePrompt)

  const imageMeta = await saveImage({
    bytes: generatedImage.bytes,
    mimeType: generatedImage.mimeType,
    filename: generatedImage.filename,
    actor,
  })

  const payload: CreateBlogInput = {
    title: draft.title,
    excerpt: draft.excerpt,
    slug: draft.slug,
    author: draft.author,
    seoKeywords: draft.seoKeywords,
    sections: draft.sections,
    status: draft.status,
    coverImageId: imageMeta.id,
  }

  return createBlog(payload, actor)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cron Jobs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hourly blog automation: plan title → generate content → publish
 */
export async function runHourlyBlogAutomation(options?: {
  title?: string
  dryRun?: boolean
  traceId?: string
}): Promise<BlogAutomationResult> {
  const startedAt = Date.now()
  const traceId = options?.traceId || `cron_${nanoid(10)}`

  try {
    const { title, targetKeywords } = await planUniqueTitleFromResume(options?.title)
    const draft = await generateBlogDraftFromTitle(title, targetKeywords)
    const slugBase = normalizeSlug(draft.slug || draft.title)

    if (options?.dryRun) {
      return {
        success: true,
        state: 'skipped',
        reason: 'Dry run enabled',
        title: draft.title,
        slug: slugBase,
        traceId,
        durationMs: Date.now() - startedAt,
      }
    }

    const post = await publishGeneratedBlog(draft)

    return {
      success: true,
      state: 'created',
      title: post.title,
      slug: post.slug,
      blogId: post.id,
      traceId,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[blog/automation] Failed:', message, error)

    return {
      success: false,
      state: 'skipped',
      reason: message,
      title: options?.title || 'Unknown',
      traceId,
      durationMs: Date.now() - startedAt,
    }
  }
}

/**
 * Calculate age of blog post in days
 */
function calculatePostAgeDays(post: SanityBlogDoc): number {
  const publishedDate = new Date(post.publishedAt || post.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - publishedDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Content refresh cron: find old posts and regenerate content
 */
export async function runContentRefreshCron(options?: {
  ageThresholdDays?: number
  dryRun?: boolean
}): Promise<ContentRefreshResult> {
  const startedAt = Date.now()
  const ageThresholdDays = options?.ageThresholdDays || Number(process.env.BLOG_REFRESH_THRESHOLD_DAYS) || 90
  const dryRun = options?.dryRun || toBoolean(process.env.BLOG_REFRESH_DRYRUN || process.env.DRY_RUN)

  console.log(`[cron/refresh] Starting — dryRun=${dryRun}, ageThreshold=${ageThresholdDays} days`)

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ageThresholdDays)
    const cutoffDateString = cutoffDate.toISOString()

    const oldPosts = await sanityClient.fetch<SanityBlogDoc[]>(
      `*[_type == "blog" && status == "published" && coalesce(publishedAt, createdAt) < $cutoffDate] 
        | order(coalesce(publishedAt, createdAt) asc) [0...1]
        {_id,title,slug,author,seoKeywords,sections,createdAt,publishedAt,updatedAt}`,
      { cutoffDate: cutoffDateString }
    )

    if (oldPosts.length === 0) {
      console.log('[cron/refresh] No posts older than threshold found')
      return {
        success: true,
        state: 'skipped',
        reason: `No posts older than ${ageThresholdDays} days found`,
        durationMs: Date.now() - startedAt,
      }
    }

    const post = oldPosts[0]
    const postAgeDays = calculatePostAgeDays(post)

    console.log(`[cron/refresh] Found post to refresh: "${post.title}" (age: ${postAgeDays} days)`)

    if (dryRun) {
      console.log('[cron/refresh] Dry run enabled — skipping actual refresh')
      return {
        success: true,
        state: 'skipped',
        reason: 'Dry run enabled',
        postId: post._id,
        postTitle: post.title,
        oldAgeDays: postAgeDays,
        durationMs: Date.now() - startedAt,
      }
    }

    const currentSections = post.sections || []
    const modificationPrompt =
      'Update content to reflect current best practices and trends. Maintain the same structure and tone. Keep the same sections and headings but refresh the content with new information and examples.'

    const newSections = await regenerateBlogContent(post.title, currentSections, modificationPrompt)
    const updatedPost = await updateBlog(post._id, { sections: newSections })

    console.log(`[cron/refresh] Refreshed post: "${post.title}" — new updatedAt: ${updatedPost?.updatedAt}`)

    return {
      success: true,
      state: 'refreshed',
      postId: post._id,
      postTitle: post.title,
      oldAgeDays: postAgeDays,
      newUpdatedAt: updatedPost?.updatedAt,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected refresh error'
    console.error('[cron/refresh] Failed:', message, error)

    return {
      success: false,
      state: 'error',
      reason: message,
      durationMs: Date.now() - startedAt,
    }
  }
}
