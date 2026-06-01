import slugify from 'slugify'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
import { parseResponse } from '@/lib/jsonParse'
import { generateBlogTitlePlanPrompt, generateSeoBlogPrompt, regenerateBlogPrompt } from '@/lib/prompts'
import { prisma } from '@/lib/prisma'
import sanityClient from '@/lib/sanity'
import { createBlog, getBlogById, saveImage, updateBlog } from '@/services/blogCmsService'
import { callCloudFlareModel } from '@/services/cloudFlareService'
import type { BlogActor, BlogSection, BlogStatus, CreateBlogInput } from '@/types/blog'

// Internal type for Sanity blog document structure
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

// Use z.union instead of z.discriminatedUnion to avoid Zod v4 _zod.propValues crash
const aiOutputSectionSchema = z.union([
  z.object({
    id: z.string().optional(),
    type: z.literal('paragraph'),
    content: z.string().min(1),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    content: z.string().min(1),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('list'),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('quote'),
    content: z.string().min(1),
    citation: z.string().optional(),
  }),
])

const aiOutputSchema = z.object({
  title: z.string().min(3).max(180),
  excerpt: z.string().min(10),
  slug: z
    .object({
      current: z.string().min(2).max(240).optional(),
    })
    .optional(),
  imagePrompt: z.string().min(5),
  seoKeywords: z.array(z.string()).optional(),
  sections: z.array(aiOutputSectionSchema).min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author: z.string().min(2).max(120).optional(),
})

const titlePlanSchema = z.object({
  title: z.string().min(8).max(180),
  targetKeywords: z.array(z.string()).optional(),
  rationale: z.string().optional(),
})

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

type GeneratedImagePayload = {
  bytes: Buffer
  mimeType: string
  filename: string
}

type OpenAIImageSize =
  | 'auto'
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1024x1536'
  | '1536x1024'
  | '1792x1024'
  | '1024x1792'

let cachedOpenAIClient: OpenAI | null = null

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

function getCronActor(): BlogActor {
  return {
    userId: process.env.BLOG_CRON_ACTOR_ID || 'cron-system',
    email: process.env.BLOG_CRON_ACTOR_EMAIL || 'cron@system.local',
  }
}

function getDefaultAuthor() {
  return process.env.BLOG_CRON_AUTHOR || 'ResumeCraft Team'
}

function getDefaultStatus(): BlogStatus {
  const status = (process.env.BLOG_CRON_DEFAULT_STATUS || 'published').toLowerCase()
  if (status === 'draft' || status === 'archived') return status
  return 'published'
}

function parseList(value?: string): string[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    }
  } catch {
    // fallback to delimiter parsing
  }

  return value
    .split(/\r?\n|\|/,)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function selectNextBlogTitle() {
  const titles = parseList(process.env.BLOG_CRON_TITLES)
  if (titles.length > 0) {
    const bucket = Math.floor(Date.now() / (60 * 60 * 1000))
    return titles[bucket % titles.length]
  }

  const keywords = parseList(process.env.BLOG_CRON_KEYWORDS)
  const keyword = keywords.length > 0 ? keywords[Math.floor(Date.now() / (60 * 60 * 1000)) % keywords.length] : 'resume writing'

  const templates = [
    'Practical ${keyword} tips that improve interview callbacks',
    'A modern guide to ${keyword} in 2026',
    'Common ${keyword} mistakes and how to avoid them',
    'How recruiters evaluate ${keyword} and what to optimize',
  ]

  const template = templates[Math.floor(Date.now() / (60 * 60 * 1000)) % templates.length]
  return template.replace('${keyword}', keyword)
}

function normalizeSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true })
}

async function callJsonApi(url: string, init: RequestInit, timeoutMs = 45000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function getGatewayToken() {
  return (
    process.env.CLOUDFLARE_AI_GATEWAY_TOKEN ||
    process.env.BLOG_AI_WORKER_API_KEY ||
    process.env.BLOG_IMAGE_API_KEY ||
    ''
  )
}

function getGatewayBaseUrl() {
  return (
    process.env.CLOUDFLARE_AI_GATEWAY_BASE_URL ||
    'https://gateway.ai.cloudflare.com/v1/c55b8fadd0c7d0e3ddbb232e935708f0/default/compat'
  )
}

function getWorkersAiImageEndpoint(modelId: string) {
  // Derive the workers-ai gateway path from the base URL.
  // Base is: https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayName}/compat
  // Image endpoint is: https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayName}/workers-ai/{modelId}
  const base = getGatewayBaseUrl().replace(/\/compat\/?$/, '')
  return `${base}/workers-ai/${modelId}`
}

function getGatewayClient() {
  const token = getGatewayToken()
  if (!token) {
    throw new Error('CLOUDFLARE_AI_GATEWAY_TOKEN is required for OpenAI-compatible Cloudflare calls')
  }

  const baseURL = getGatewayBaseUrl()

  if (!cachedOpenAIClient) {
    cachedOpenAIClient = new OpenAI({
      apiKey: token,
      baseURL,
      defaultHeaders: {
        'cf-aig-authorization': `Bearer ${token}`,
      },
    })
  }

  return cachedOpenAIClient
}

function getOpenAIImageSize(): OpenAIImageSize {
  const raw = process.env.BLOG_IMAGE_API_SIZE || '1536x1024'
  const allowed: OpenAIImageSize[] = [
    'auto',
    '256x256',
    '512x512',
    '1024x1024',
    '1024x1536',
    '1536x1024',
    '1792x1024',
    '1024x1792',
  ]

  return allowed.includes(raw as OpenAIImageSize) ? (raw as OpenAIImageSize) : '1536x1024'
}

function pickFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function toRawTextFromUnknown(payload: unknown) {
  if (typeof payload === 'string') return payload

  if (payload && typeof payload === 'object') {
    const typed = payload as Record<string, unknown>

    const directText = pickFirstString([
      typed.output,
      typed.result,
      typed.text,
      typed.response,
      typed.content,
      typed.message,
    ])

    if (directText) return directText

    const nestedData = typed.data
    if (typeof nestedData === 'string') return nestedData

    if (Array.isArray(nestedData)) {
      const joined = nestedData
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            const candidate = (item as Record<string, unknown>).text
            return typeof candidate === 'string' ? candidate : ''
          }
          return ''
        })
        .join('\n')
        .trim()

      if (joined) return joined
    }

    return JSON.stringify(payload)
  }

  return String(payload || '')
}

async function requestBlogDraftFromWorker(prompt: string, title: string) {
  const url = process.env.BLOG_AI_WORKER_URL
  if (!url) {
    throw new Error('BLOG_AI_WORKER_URL is required')
  }

  const apiKey = process.env.BLOG_AI_WORKER_API_KEY
  const model = process.env.BLOG_AI_WORKER_MODEL
  const timeoutMs = Number(process.env.BLOG_AI_WORKER_TIMEOUT_MS || 60000)

  const payload = {
    prompt,
    title,
    model,
    responseFormat: 'json',
  }

  const response = await callJsonApi(
    url,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    },
    Number.isNaN(timeoutMs) ? 60000 : timeoutMs
  )

  if (!response.ok) {
    const reason = await response.text().catch(() => '')
    throw new Error(`Blog AI worker failed (${response.status}): ${reason.slice(0, 300)}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function requestGatewayText(prompt: string, model: string) {
  return callCloudFlareModel({
    model,
    prompt,
    token: getGatewayToken(),
    baseURL: getGatewayBaseUrl(),
  })
}

async function requestBlogDraftFromGateway(prompt: string) {
  const model = process.env.BLOG_AI_WORKER_MODEL || 'workers-ai/@cf/zai-org/glm-4.7-flash'
  return requestGatewayText(prompt, model)
}

async function executeAiWithFallback(prompt: string, taskTitle: string = 'automation') {
  const hasGateway = Boolean(getGatewayToken())
  const hasWorker = Boolean(process.env.BLOG_AI_WORKER_URL)
  const hasGemini = Boolean(process.env.GEMINI_API_KEY)

  let lastError: Error | null = null

  // 1. Try Gemini first if available (usually fastest & most reliable)
  if (hasGemini) {
    try {
      return await requestBlogDraftFromGemini(prompt)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('Gemini AI failed, falling back:', lastError.message)
    }
  }

  // 2. Try Gateway (Cloudflare compatibility endpoint)
  if (hasGateway) {
    try {
      const model = process.env.BLOG_TITLE_AI_MODEL || process.env.BLOG_AI_WORKER_MODEL || 'workers-ai/@cf/zai-org/glm-4.7-flash'
      return await requestGatewayText(prompt, model)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('Gateway AI failed, falling back:', lastError.message)
    }
  }

  // 3. Try fallback worker endpoint
  if (hasWorker) {
    try {
      return await requestBlogDraftFromWorker(prompt, taskTitle)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('Worker AI failed:', lastError.message)
    }
  }

  throw lastError || new Error('No AI provider configured or all configured providers failed')
}

// ─── Gemini fallback (uses GEMINI_API_KEY, same key as the rest of the app) ───

async function requestBlogDraftFromGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const genAI = new GoogleGenAI({ apiKey })

  // Try fast model first, fall back to flash
  const models = [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]

  let lastError: Error | null = null
  for (const model of models) {
    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      const text = response.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('') ?? ''
      if (!text) throw new Error(`Empty response from ${model}`)
      return text
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`Gemini model ${model} failed: ${lastError.message}`)
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

function normalizeTitleKey(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function cleanCandidateTitle(value: string) {
  return value.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '').replace(/\s+/g, ' ')
}

function uniqueStrings(values: string[], max = 20) {
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

function asObject(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

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

  const primaryRole = pickFirstString(
    experiences.map((item) => item.title).filter((item) => typeof item === 'string')
  ) || latestResume.title

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

async function getExistingBlogTitleIndex() {
  const limit = Math.max(Number(process.env.BLOG_TITLE_LOOKBACK_LIMIT || 500), 100)
  const docs = await sanityClient.fetch<Array<{ title?: string; slug?: { current?: string } }>>(
    '*[_type == "blog"] | order(coalesce(publishedAt, createdAt) desc)[0...$limit]{title,slug}',
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

  return {
    titles,
    blockedKeys,
  }
}

async function isTitleOrSlugUsed(title: string, slug: string) {
  const count = await sanityClient.fetch<number>(
    'count(*[_type == "blog" && (title == $title || slug.current == $slug)])',
    { title, slug }
  )

  return count > 0
}

function parseTitleFromAi(raw: unknown): string | null {
  const text = toRawTextFromUnknown(raw)

  try {
    const parsed = parseResponse(text)
    const validated = titlePlanSchema.safeParse(parsed)
    if (validated.success) {
      return cleanCandidateTitle(validated.data.title)
    }

    if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as Record<string, unknown>).title
      if (typeof candidate === 'string' && candidate.trim()) {
        return cleanCandidateTitle(candidate)
      }
    }
  } catch {
    // fallback to plain text line parsing
  }

  const firstLine = text.split(/\r?\n/).find((line) => line.trim())
  if (!firstLine) return null

  return cleanCandidateTitle(firstLine)
}

function parseTitlePlanFromAi(raw: unknown): { title: string; targetKeywords: string[] } {
  const text = toRawTextFromUnknown(raw)

  try {
    const parsed = parseResponse(text)
    const validated = titlePlanSchema.safeParse(parsed)
    if (validated.success) {
      return {
        title: cleanCandidateTitle(validated.data.title),
        targetKeywords: validated.data.targetKeywords || [],
      }
    }

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
    // fallback to plain text line parsing
  }

  const fallbackTitle = parseTitleFromAi(raw)
  return {
    title: fallbackTitle || '',
    targetKeywords: [],
  }
}

async function planUniqueTitleFromResume(preferredTitle?: string): Promise<{ title: string; targetKeywords: string[] }> {
  const [resumeContext, existing] = await Promise.all([
    buildResumeContextForTitlePlanning(),
    getExistingBlogTitleIndex(),
  ])

  const blocked = new Set<string>(existing.blockedKeys)

  if (preferredTitle?.trim()) {
    const given = cleanCandidateTitle(preferredTitle)
    const givenSlug = normalizeSlug(given)
    const used = blocked.has(normalizeTitleKey(given)) || blocked.has(givenSlug) || await isTitleOrSlugUsed(given, givenSlug)

    if (!used) {
      return { title: given, targetKeywords: [] }
    }

    blocked.add(normalizeTitleKey(given))
    blocked.add(givenSlug)
  }

  const retryCount = Math.max(Number(process.env.BLOG_TITLE_GEN_RETRIES || 5), 2)
  const hasGateway = Boolean(getGatewayToken())
  const hasWorkerEndpoint = Boolean(process.env.BLOG_AI_WORKER_URL)
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)

  if (hasGateway || hasWorkerEndpoint || hasGeminiKey) {
    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
      const prompt = generateBlogTitlePlanPrompt({
        resumeContext,
        existingTitles: existing.titles.slice(0, 120),
        blockedTitles: Array.from(blocked).slice(-80),
        attempt,
      })

      let aiResponse: string
      try {
        aiResponse = await executeAiWithFallback(prompt, 'title-planning')
      } catch (err) {
        console.warn('All AI title generation attempts failed:', err)
        break // break the loop and use fallback base
      }

      const result = parseTitlePlanFromAi(aiResponse)
      if (!result.title) continue

      const slug = normalizeSlug(result.title)
      const key = normalizeTitleKey(result.title)
      const used = blocked.has(key) || blocked.has(slug) || await isTitleOrSlugUsed(result.title, slug)

      if (used) {
        blocked.add(key)
        blocked.add(slug)
        continue
      }

      return result
    }
  }

  const fallbackBase = resumeContext.primaryRole
    ? `Resume tips for ${resumeContext.primaryRole} professionals`
    : selectNextBlogTitle()

  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0
      ? fallbackBase
      : `${fallbackBase} ${new Date().getUTCFullYear()} edition ${i + 1}`

    const slug = normalizeSlug(candidate)
    const key = normalizeTitleKey(candidate)
    const used = blocked.has(key) || blocked.has(slug) || await isTitleOrSlugUsed(candidate, slug)

    if (!used) {
      return { title: candidate, targetKeywords: [] }
    }
  }

  return { title: `${fallbackBase} ${Date.now()}`, targetKeywords: [] }
}

export function validateAndNormalizeBlogDraft(raw: unknown, fallbackAuthor?: string): GeneratedBlogDraft {
  const payload = typeof raw === 'string' ? parseResponse(raw) : raw
  const parsed = aiOutputSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid AI blog output')
  }

  const value = parsed.data
  if (value.sections.length < 2) {
    throw new Error('AI output must contain at least 2 sections')
  }

  const sections = value.sections.map((s) => ({
    ...s,
    id: s.id || `sec_${nanoid(8)}`,
  })) as BlogSection[]

  return {
    title: value.title,
    excerpt: value.excerpt,
    slug: value.slug?.current,
    imagePrompt: value.imagePrompt,
    seoKeywords: value.seoKeywords || [],
    sections,
    status: value.status || getDefaultStatus(),
    author: value.author || fallbackAuthor || getDefaultAuthor(),
  }
}

function parseImageDataUri(dataUri: string): GeneratedImagePayload | null {
  const matched = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!matched) return null

  const mimeType = matched[1]
  const base64 = matched[2]
  return {
    bytes: Buffer.from(base64, 'base64'),
    mimeType,
    filename: `blog-${Date.now()}`,
  }
}

async function fetchImageFromUrl(url: string): Promise<GeneratedImagePayload> {
  const response = await callJsonApi(url, { method: 'GET' }, Number(process.env.BLOG_IMAGE_FETCH_TIMEOUT_MS || 45000))

  if (!response.ok) {
    throw new Error(`Failed to download image from URL (${response.status})`)
  }

  const mimeType = response.headers.get('content-type') || 'image/png'
  const bytes = Buffer.from(await response.arrayBuffer())

  return {
    bytes,
    mimeType,
    filename: `blog-${Date.now()}`,
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function chunkText(value: string, lineLength = 34, maxLines = 5) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= lineLength) {
      current = next
      continue
    }

    if (current) {
      lines.push(current)
      if (lines.length >= maxLines) return lines
    }

    current = word.slice(0, lineLength)
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  return lines.length > 0 ? lines : ['AI blog cover preview']
}

function createFallbackCoverImagePayload(imagePrompt: string, reason?: string): GeneratedImagePayload {
  const promptLines = chunkText(imagePrompt, 34, 5)
  const subtitle = chunkText(reason || 'Cloudflare image generation unavailable', 44, 2)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024" role="img" aria-label="AI generated fallback cover">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#155e75" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="1536" height="1024" fill="url(#bg)" />
  <circle cx="1240" cy="180" r="180" fill="rgba(255,255,255,0.12)" />
  <circle cx="280" cy="860" r="240" fill="rgba(255,255,255,0.08)" />
  <rect x="108" y="128" width="1320" height="768" rx="40" fill="rgba(15,23,42,0.32)" stroke="rgba(255,255,255,0.18)" />
  <text x="156" y="224" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">ResumeCraft AI Cover</text>
  <text x="156" y="284" fill="#bae6fd" font-family="Segoe UI, Arial, sans-serif" font-size="22">${escapeXml(subtitle[0] || '')}</text>
  <text x="156" y="316" fill="#bae6fd" font-family="Segoe UI, Arial, sans-serif" font-size="22">${escapeXml(subtitle[1] || '')}</text>
  ${promptLines.map((line, index) => `<text x="156" y="${420 + index * 72}" fill="#ffffff" font-family="Georgia, Times New Roman, serif" font-size="54" font-weight="700">${escapeXml(line)}</text>`).join('')}
  <text x="156" y="836" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="24">Generated locally because the upstream image endpoint returned an error.</text>
</svg>`.trim()

  return {
    bytes: Buffer.from(svg, 'utf8'),
    mimeType: 'image/svg+xml',
    filename: `blog-${Date.now()}.svg`,
  }
}

// Image style presets with brand color integration (teal/slate palette)
const IMAGE_STYLE_PRESETS = [
  {
    name: 'modern-workspace',
    prompt: 'Modern minimalist office workspace with laptop and documents, teal accent lighting, slate gray surfaces, natural window light, shallow depth of field, professional photography, clean aesthetic, corporate environment',
  },
  {
    name: 'professional-desk',
    prompt: 'Professional business desk setup with resume documents, teal colored notebook or accessories, slate gray background, soft studio lighting, high-quality photography, contemporary office interior, sharp focus',
  },
  {
    name: 'tech-workspace',
    prompt: 'Contemporary tech workspace with computer screen, teal ambient lighting, slate colored desk and walls, natural lighting from window, photorealistic, modern corporate aesthetic, professional photography',
  },
  {
    name: 'career-concept',
    prompt: 'Professional career development concept, business documents on clean desk, teal and slate color scheme, natural daylight, shallow depth of field, high-end photography, modern minimalist style',
  },
  {
    name: 'office-interior',
    prompt: 'Modern office interior with professional workspace, teal accent wall or decor, slate gray furniture, natural lighting, photorealistic photography, clean lines, corporate environment, 8k quality',
  },
]

function selectRandomImageStyle(): string {
  const randomIndex = Math.floor(Math.random() * IMAGE_STYLE_PRESETS.length)
  return IMAGE_STYLE_PRESETS[randomIndex].prompt
}

export async function generateCoverImageFromPrompt(imagePrompt: string): Promise<GeneratedImagePayload> {
  const token = getGatewayToken()

  // Select a random style preset and combine with the AI-generated prompt
  const stylePreset = selectRandomImageStyle()

  // Enhance the prompt for better photorealistic results with brand colors
  const enhancedPrompt = `${stylePreset}, ${imagePrompt}, high quality, sharp focus, professional color grading, teal and slate color palette, no text, no words, no typography, no illustrations, photorealistic, 8k resolution`

  if (token) {
    // Step 1: try OpenAI compat endpoint (workers-ai/ prefix + cf-aig-authorization header)
    try {
      const client = getGatewayClient()
      const modelId = process.env.BLOG_IMAGE_API_MODEL || '@cf/black-forest-labs/flux-2-klein-9b'
      const compatModelId = `workers-ai/${modelId}`
      const [w, h] = (process.env.BLOG_IMAGE_API_SIZE || '1024x1024').split('x')
      const size = (`${w}x${h}` as ReturnType<typeof getOpenAIImageSize>)

      const result = await client.images.generate({
        model: compatModelId,
        prompt: enhancedPrompt,
        size,
      })

      const firstImage = (result as { data?: Array<{ b64_json?: string; url?: string }> }).data?.[0]
      if (firstImage?.b64_json) {
        return {
          bytes: Buffer.from(firstImage.b64_json, 'base64'),
          mimeType: 'image/jpeg',
          filename: `blog-${Date.now()}.jpg`,
        }
      }
    } catch {
      // fall through to FormData path
    }

    // Step 2: fall back to direct workers-ai FormData endpoint
    try {
      const modelId = process.env.BLOG_IMAGE_API_MODEL || '@cf/black-forest-labs/flux-2-klein-9b'
      const endpoint = getWorkersAiImageEndpoint(modelId)
      const [width, height] = (process.env.BLOG_IMAGE_API_SIZE || '1024x1024').split('x')

      const form = new FormData()
      form.append('prompt', enhancedPrompt)
      form.append('width', width || '1024')
      form.append('height', height || '1024')
      // Add guidance scale for better quality (higher = more prompt adherence)
      form.append('guidance', '7.5')
      // Add steps for better quality (more steps = better detail)
      form.append('num_steps', '30')

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'cf-aig-authorization': `Bearer ${token}`,
        },
        body: form,
      })

      const bodyText = await response.text()
      if (!response.ok) {
        throw new Error(`Workers AI image request failed (${response.status}): ${bodyText.slice(0, 300)}`)
      }

      const json = JSON.parse(bodyText) as { image?: string; result?: { image?: string } }
      const base64Image = json.image ?? json.result?.image

      if (base64Image) {
        const rawBase64 = base64Image.includes(',') ? (base64Image.split(',').pop() ?? base64Image) : base64Image
        return {
          bytes: Buffer.from(rawBase64, 'base64'),
          mimeType: 'image/jpeg',
          filename: `blog-${Date.now()}.jpg`,
        }
      }

      throw new Error('Workers AI image response contained no image data')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Cloudflare image error'
      console.warn('Cloudflare image generation failed, trying Pollinations fallback...', reason)
      
      try {
        // Fallback to a free community image generator before resorting to SVG
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=680&nologo=true&model=flux`
        const fallbackRes = await fetch(fallbackUrl, { method: 'GET' })
        
        if (fallbackRes.ok) {
          return {
            bytes: Buffer.from(await fallbackRes.arrayBuffer()),
            mimeType: fallbackRes.headers.get('content-type') || 'image/jpeg',
            filename: `blog-fallback-${Date.now()}.jpg`,
          }
        }
      } catch (fallbackErr) {
        console.warn('Pollinations fallback failed as well:', fallbackErr)
      }

      console.warn('Falling back to local SVG cover image:', reason)
      return createFallbackCoverImagePayload(imagePrompt, reason)
    }
  }

  const url = process.env.BLOG_IMAGE_API_URL
  if (!url) {
    return createFallbackCoverImagePayload(imagePrompt, 'Image API not configured')
  }

  const apiKey = process.env.BLOG_IMAGE_API_KEY
  const model = process.env.BLOG_IMAGE_API_MODEL || 'flux-2-klein-9b'
  const timeoutMs = Number(process.env.BLOG_IMAGE_API_TIMEOUT_MS || 90000)

  const response = await callJsonApi(
    url,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        model,
        size: process.env.BLOG_IMAGE_API_SIZE || '1536x1024',
        guidance: 7.5,
        num_steps: 30,
      }),
    },
    Number.isNaN(timeoutMs) ? 90000 : timeoutMs
  )

  if (!response.ok) {
    const reason = await response.text().catch(() => '')
    console.warn(`Falling back to local SVG cover image: Image API failed (${response.status})`)
    return createFallbackCoverImagePayload(imagePrompt, `Image API failed (${response.status}) ${reason.slice(0, 120)}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.startsWith('image/')) {
    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      mimeType: contentType,
      filename: `blog-${Date.now()}`,
    }
  }

  const json = await response.json().catch(() => null)
  if (!json || typeof json !== 'object') {
    return createFallbackCoverImagePayload(imagePrompt, 'Image API returned invalid JSON payload')
  }

  const payload = json as Record<string, unknown>
  const base64 = pickFirstString([
    payload.base64,
    payload.imageBase64,
    payload.b64,
    payload.data,
    Array.isArray(payload.images) && payload.images.length > 0
      ? (payload.images[0] as Record<string, unknown>).base64
      : null,
  ])

  if (base64) {
    const dataUriPayload = parseImageDataUri(base64)
    if (dataUriPayload) return dataUriPayload

    return {
      bytes: Buffer.from(base64, 'base64'),
      mimeType: (pickFirstString([payload.mimeType, payload.contentType]) || 'image/png').toLowerCase(),
      filename: `blog-${Date.now()}`,
    }
  }

  const remoteUrl = pickFirstString([
    payload.url,
    payload.imageUrl,
    payload.outputUrl,
    payload.cdnUrl,
  ])

  if (remoteUrl) {
    return fetchImageFromUrl(remoteUrl)
  }

  return createFallbackCoverImagePayload(imagePrompt, 'Image API response did not include image bytes')
}

export async function generateBlogDraftFromTitle(title: string, targetKeywords: string[] = []) {
  const author = getDefaultAuthor()
  const prompt = generateSeoBlogPrompt(title, author, targetKeywords)
  const hasGatewayToken = Boolean(getGatewayToken())
  const hasWorkerUrl = Boolean(process.env.BLOG_AI_WORKER_URL)
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)

  if (!hasGatewayToken && !hasWorkerUrl && !hasGeminiKey) {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY, CLOUDFLARE_AI_GATEWAY_TOKEN, or BLOG_AI_WORKER_URL.')
  }

  const rawText = toRawTextFromUnknown(await executeAiWithFallback(prompt, title))

  const parsed = parseResponse(rawText)
  const draft = validateAndNormalizeBlogDraft(parsed, author)

  // Keep the planner-selected title as source of truth to prevent title reuse drift.
  draft.title = title
  draft.slug = normalizeSlug(title)

  return draft
}

export async function regenerateBlogContent(title: string, currentSections: BlogSection[], modificationPrompt: string) {
  // Convert current sections to a simple text summary for the AI to understand current state
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
  
  const workerResult = await executeAiWithFallback(prompt, title)

  const rawText = toRawTextFromUnknown(workerResult)
  const parsed = parseResponse(rawText)
  
  // Validation for regeneration: strictly check sections part
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).sections)) {
    throw new Error('AI regeneration returned invalid format')
  }

  const sections = (parsed as any).sections.map((s: any) => ({
    ...s,
    id: s.id || `sec_${nanoid(8)}`,
  })) as BlogSection[]

  return sections
}

export async function publishGeneratedBlog(draft: GeneratedBlogDraft, actor = getCronActor()) {
  const generatedImage = await generateCoverImageFromPrompt(draft.imagePrompt)

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

export async function runHourlyBlogAutomation(options?: {
  title?: string
  dryRun?: boolean
  traceId?: string
}): Promise<BlogAutomationResult> {
  const startedAt = Date.now()
  const traceId = options?.traceId || `cron_${nanoid(10)}`
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

function getRefreshActor(): BlogActor {
  return {
    userId: process.env.BLOG_REFRESH_AUTHOR_ID || 'cron-refresh',
    email: process.env.BLOG_REFRESH_AUTHOR_EMAIL || 'refresh@system.local',
  }
}

/**
 * Refreshes an old blog post by regenerating its content while preserving metadata.
 * 
 * @param postId - The ID of the blog post to refresh
 * @param actor - The actor performing the refresh operation
 * @returns The updated blog post or null if not found
 */
export async function refreshOldBlogPost(postId: string, actor: BlogActor) {
  const post = await getBlogById(postId)

  if (!post) {
    throw new Error(`Blog post with ID ${postId} not found`)
  }

  // Regenerate content
  const newSections = await regenerateBlogContent(
    post.title,
    post.sections,
    "Update content to reflect current best practices and trends. Maintain the same structure and tone."
  )

  // Update post with new content (preserves original metadata like title, slug, author, publishedAt)
  // Note: updatedAt is automatically set by updateBlog()
  return await updateBlog(postId, {
    sections: newSections
  })
}

export async function runContentRefreshCron(options?: {
  ageThresholdDays?: number
  dryRun?: boolean
}): Promise<ContentRefreshResult> {
  const startedAt = Date.now()
  const ageThresholdDays = options?.ageThresholdDays ||
    Number(process.env.BLOG_REFRESH_THRESHOLD_DAYS) || 90
  const dryRun = options?.dryRun ||
    toBoolean(process.env.BLOG_REFRESH_DRYRUN || process.env.DRY_RUN || 'false')

  console.log(`[cron/refresh] Starting — dryRun=${dryRun}, ageThreshold=${ageThresholdDays} days`)

  try {
    // Query Sanity for published posts older than threshold
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

    // Regenerate content
    const currentSections = post.sections || []
    const modificationPrompt = "Update content to reflect current best practices and trends. Maintain the same structure and tone. Keep the same sections and headings but refresh the content with new information and examples."

    const newSections = await regenerateBlogContent(post.title, currentSections, modificationPrompt)

    // Update the post with new content (preserve metadata)
    // Note: updatedAt is automatically set by updateBlog()
    const updatedPost = await updateBlog(post._id, {
      sections: newSections,
    })

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

function calculatePostAgeDays(post: SanityBlogDoc): number {
  const publishedDate = new Date(post.publishedAt || post.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - publishedDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function toBoolean(value: string | undefined | null): boolean {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}
