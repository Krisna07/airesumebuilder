import slugify from 'slugify'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import OpenAI from 'openai'
import { parseResponse } from '@/lib/jsonParse'
import { generateBlogTitlePlanPrompt, generateSeoBlogPrompt } from '@/lib/prompts'
import { prisma } from '@/lib/prisma'
import sanityClient from '@/lib/sanity'
import { createBlog, saveImage } from '@/services/blogCmsService'
import type { BlogActor, BlogSection, BlogStatus, CreateBlogInput } from '@/types/blog'

const aiOutputSectionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().optional(),
    type: z.literal('paragraph'),
    content: z.string().trim().min(1),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('quote'),
    content: z.string().trim().min(1),
    citation: z.string().trim().optional(),
  }),
])

const aiOutputSchema = z.object({
  title: z.string().trim().min(3).max(180),
  excerpt: z.string().trim().min(10),
  slug: z
    .object({
      current: z.string().trim().min(2).max(240).optional(),
    })
    .optional(),
  imagePrompt: z.string().trim().min(5),
  sections: z.array(aiOutputSectionSchema).min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author: z.string().trim().min(2).max(120).optional(),
})

const titlePlanSchema = z.object({
  title: z.string().trim().min(8).max(180),
  targetKeywords: z.array(z.string().trim()).optional(),
  rationale: z.string().trim().optional(),
})

type GeneratedBlogDraft = {
  title: string
  excerpt: string
  slug?: string
  imagePrompt: string
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
  const client = getGatewayClient()

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content in Cloudflare AI response')
  }

  return content
}

async function requestBlogDraftFromGateway(prompt: string) {
  const model = process.env.BLOG_AI_WORKER_MODEL || 'workers-ai/@cf/zai-org/glm-4.7-flash'
  return requestGatewayText(prompt, model)
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

async function planUniqueTitleFromResume(preferredTitle?: string) {
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
      return given
    }

    blocked.add(normalizeTitleKey(given))
    blocked.add(givenSlug)
  }

  const retryCount = Math.max(Number(process.env.BLOG_TITLE_GEN_RETRIES || 5), 2)
  const hasGateway = Boolean(getGatewayToken())
  const hasWorkerEndpoint = Boolean(process.env.BLOG_AI_WORKER_URL)

  if (hasGateway || hasWorkerEndpoint) {
    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
      const prompt = generateBlogTitlePlanPrompt({
        resumeContext,
        existingTitles: existing.titles.slice(0, 120),
        blockedTitles: Array.from(blocked).slice(-80),
        attempt,
      })

      const aiResponse = hasGateway
        ? await requestGatewayText(prompt, process.env.BLOG_TITLE_AI_MODEL || process.env.BLOG_AI_WORKER_MODEL || 'workers-ai/@cf/zai-org/glm-4.7-flash')
        : await requestBlogDraftFromWorker(prompt, 'title-planning')

      const candidate = parseTitleFromAi(aiResponse)
      if (!candidate) continue

      const slug = normalizeSlug(candidate)
      const key = normalizeTitleKey(candidate)
      const used = blocked.has(key) || blocked.has(slug) || await isTitleOrSlugUsed(candidate, slug)

      if (used) {
        blocked.add(key)
        blocked.add(slug)
        continue
      }

      return candidate
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
      return candidate
    }
  }

  return `${fallbackBase} ${Date.now()}`
}

export function validateAndNormalizeBlogDraft(raw: unknown, fallbackAuthor?: string): GeneratedBlogDraft {
  const payload = typeof raw === 'string' ? parseResponse(raw) : raw
  const parsed = aiOutputSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid AI blog output')
  }

  const value = parsed.data
  const paragraphs = value.sections.filter((section) => section.type === 'paragraph')
  const quote = value.sections.find((section) => section.type === 'quote')

  if (paragraphs.length < 3) {
    throw new Error('AI output must contain at least 3 paragraph sections')
  }

  if (!quote) {
    throw new Error('AI output must include one quote section')
  }

  const orderedSections: BlogSection[] = [
    {
      id: `sec_${nanoid(8)}`,
      type: 'paragraph',
      content: paragraphs[0].content,
    },
    {
      id: `sec_${nanoid(8)}`,
      type: 'quote',
      content: quote.content,
      citation: quote.citation,
    },
    {
      id: `sec_${nanoid(8)}`,
      type: 'paragraph',
      content: paragraphs[1].content,
    },
    {
      id: `sec_${nanoid(8)}`,
      type: 'paragraph',
      content: paragraphs[2].content,
    },
  ]

  return {
    title: value.title,
    excerpt: value.excerpt,
    slug: value.slug?.current,
    imagePrompt: value.imagePrompt,
    sections: orderedSections,
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

export async function generateCoverImageFromPrompt(imagePrompt: string): Promise<GeneratedImagePayload> {
  const token = getGatewayToken()

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
        prompt: imagePrompt,
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
      form.append('prompt', imagePrompt)
      form.append('width', width || '1024')
      form.append('height', height || '1024')

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
        prompt: imagePrompt,
        model,
        size: process.env.BLOG_IMAGE_API_SIZE || '1536x1024',
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

async function isPotentialDuplicate(title: string, slugBase: string) {
  const hours = Math.max(Number(process.env.BLOG_CRON_DEDUPE_WINDOW_HOURS || 48), 1)
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const pattern = `${slugBase}*`

  const count = await sanityClient.fetch<number>(
    'count(*[_type == "blog" && (title == $title || slug.current match $pattern) && dateTime(createdAt) > dateTime($since)])',
    { title, pattern, since }
  )

  return count > 0
}

export async function generateBlogDraftFromTitle(title: string) {
  const author = getDefaultAuthor()
  const prompt = generateSeoBlogPrompt(title, author)
  const hasGatewayToken = Boolean(getGatewayToken())
  const workerResult = hasGatewayToken
    ? await requestBlogDraftFromGateway(prompt)
    : await requestBlogDraftFromWorker(prompt, title)

  const rawText = toRawTextFromUnknown(workerResult)
  const parsed = parseResponse(rawText)
  const draft = validateAndNormalizeBlogDraft(parsed, author)

  // Keep the planner-selected title as source of truth to prevent title reuse drift.
  draft.title = title
  draft.slug = normalizeSlug(title)

  return draft
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
  const title = await planUniqueTitleFromResume(options?.title)

  const draft = await generateBlogDraftFromTitle(title)
  const slugBase = normalizeSlug(draft.slug || draft.title)

  const duplicate = await isPotentialDuplicate(draft.title, slugBase)
  if (duplicate) {
    return {
      success: true,
      state: 'skipped',
      reason: 'Potential duplicate in dedupe window',
      title: draft.title,
      slug: slugBase,
      traceId,
      durationMs: Date.now() - startedAt,
    }
  }

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
