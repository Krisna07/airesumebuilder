/**
 * Image Generation Service
 * 
 * Handles blog cover image generation with multiple fallback providers.
 * Supports: Google Gemini image models, OpenAI-compatible Cloudflare gateway, Workers AI,
 * Pollinations, and SVG fallback.
 */

import { GoogleGenAI } from '@google/genai'

type GeneratedImagePayload = {
  bytes: Buffer
  mimeType: string
  filename: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

function getGatewayBaseUrl(): string {
  return (
    process.env.CLOUDFLARE_AI_GATEWAY_BASE_URL ||
    'https://gateway.ai.cloudflare.com/v1/c55b8fadd0c7d0e3ddbb232e935708f0/default/compat'
  )
}

function getCloudflareAccountId(): string {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID
  // Extract from gateway URL: https://gateway.ai.cloudflare.com/v1/{accountId}/...
  const match = getGatewayBaseUrl().match(/\/v1\/([a-f0-9]+)\//)
  return match?.[1] ?? ''
}

function getPrimaryGoogleImageModel(): string {
  return 'gemini-3.1-flash-image'
}

function getSecondaryGoogleImageModel(): string {
  return 'gemini-3.1-flash-lite-image'
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function chunkText(value: string, lineLength = 34, maxLines = 5): string[] {
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

/**
 * Image style presets with brand color integration (teal/slate palette)
 */
const IMAGE_STYLE_PRESETS = [
  {
    name: 'modern-workspace',
    prompt:
      'Modern minimalist office workspace with laptop and documents, teal accent lighting, slate gray surfaces, natural window light, shallow depth of field, professional photography, clean aesthetic, corporate environment',
  },
  {
    name: 'professional-desk',
    prompt:
      'Professional business desk setup with resume documents, teal colored notebook or accessories, slate gray background, soft studio lighting, high-quality photography, contemporary office interior, sharp focus',
  },
  {
    name: 'tech-workspace',
    prompt:
      'Contemporary tech workspace with computer screen, teal ambient lighting, slate colored desk and walls, natural lighting from window, photorealistic, modern corporate aesthetic, professional photography',
  },
  {
    name: 'career-concept',
    prompt:
      'Professional career development concept, business documents on clean desk, teal and slate color scheme, natural daylight, shallow depth of field, high-end photography, modern minimalist style',
  },
  {
    name: 'office-interior',
    prompt:
      'Modern office interior with professional workspace, teal accent wall or decor, slate gray furniture, natural lighting, photorealistic photography, clean lines, corporate environment, 8k quality',
  },
]

function selectRandomImageStyle(): string {
  const randomIndex = Math.floor(Math.random() * IMAGE_STYLE_PRESETS.length)
  return IMAGE_STYLE_PRESETS[randomIndex].prompt
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an SVG fallback image when all providers fail
 */
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

/**
 * Try fetching image from a remote URL
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Provider Implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Try generating image via Cloudflare Workers AI REST API.
 *
 * Requires CLOUDFLARE_API_TOKEN (a full Cloudflare API token with Workers AI: Read permission —
 * NOT the AI Gateway token) and CLOUDFLARE_ACCOUNT_ID (auto-extracted from gateway URL if unset).
 *
 * Docs: https://developers.cloudflare.com/ai-gateway/usage/providers/workersai/
 */
async function tryCloudflareWorkersAi(prompt: string): Promise<GeneratedImagePayload | null> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const accountId = getCloudflareAccountId()
  if (!apiToken || !accountId) return null

  try {
    const modelId = process.env.BLOG_IMAGE_API_MODEL || '@cf/black-forest-labs/flux-1-schnell'
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'cf-aig-gateway-id': 'default',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const bodyText = await response.text()
    if (!response.ok) {
      throw new Error(`Workers AI failed (${response.status}): ${bodyText.slice(0, 300)}`)
    }

    // Flux-1-schnell returns wrapped base64: { result: { image: "..." }, success: true }
    const json = JSON.parse(bodyText) as { result?: { image?: string }; image?: string }
    const base64Image = json.result?.image ?? json.image

    if (base64Image) {
      const raw = base64Image.includes(',') ? (base64Image.split(',').pop() ?? base64Image) : base64Image
      return {
        bytes: Buffer.from(raw, 'base64'),
        mimeType: 'image/jpeg',
        filename: `blog-${Date.now()}.jpg`,
      }
    }

    throw new Error('Workers AI response contained no image data')
  } catch (err) {
    console.warn('[image] Workers AI failed:', err)
  }

  return null
}

/**
 * Try generating image via Pollinations free API (community fallback)
 */
async function tryPollinationsFallback(prompt: string): Promise<GeneratedImagePayload | null> {
  try {
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=680&nologo=true&model=flux`
    const pollinationsController = new AbortController()
    const pollinationsTimeout = setTimeout(() => pollinationsController.abort(), Number(process.env.BLOG_IMAGE_FETCH_TIMEOUT_MS || 45000))
    let response: Response
    try {
      response = await fetch(fallbackUrl, { method: 'GET', signal: pollinationsController.signal })
    } finally {
      clearTimeout(pollinationsTimeout)
    }

    if (response.ok) {
      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        mimeType: response.headers.get('content-type') || 'image/jpeg',
        filename: `blog-fallback-${Date.now()}.jpg`,
      }
    }

    throw new Error(`Pollinations returned ${response.status}`)
  } catch (err) {
    console.warn('Pollinations fallback failed:', err)
  }

  return null
}

/**
 * Try generating image via custom image API endpoint
 */
async function tryCustomImageApi(prompt: string): Promise<GeneratedImagePayload | null> {
  const url = process.env.BLOG_IMAGE_API_URL
  if (!url) return null

  try {
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
          prompt,
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
      throw new Error(`API failed (${response.status}): ${reason.slice(0, 120)}`)
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
    if (!json || typeof json !== 'object') return null

    const payload = json as Record<string, unknown>

    // Try various response formats
    let base64: string | null = null
    for (const key of ['base64', 'imageBase64', 'b64', 'data']) {
      const candidate = payload[key]
      if (typeof candidate === 'string') {
        base64 = candidate
        break
      }
    }

    if (!base64 && Array.isArray(payload.images) && payload.images.length > 0) {
      const firstImage = payload.images[0] as Record<string, unknown>
      if (typeof firstImage.base64 === 'string') {
        base64 = firstImage.base64
      }
    }

    if (base64) {
      return {
        bytes: Buffer.from(base64, 'base64'),
        mimeType: 'image/png',
        filename: `blog-${Date.now()}`,
      }
    }

    // Try URL in response
    for (const key of ['url', 'imageUrl', 'outputUrl', 'cdnUrl']) {
      const candidate = payload[key]
      if (typeof candidate === 'string') {
        return fetchImageFromUrl(candidate)
      }
    }

    throw new Error('API response did not include image data')
  } catch (err) {
    console.warn('Custom image API failed:', err)
  }

  return null
}

/**
 * Try generating image via Gemini native image models.
 */
async function tryGoogleGeminiImage(prompt: string, model: string): Promise<GeneratedImagePayload | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const ai = new GoogleGenAI({ apiKey })
    const config: any = {
      responseModalities: ['IMAGE'],
      responseFormat: {
        image: {
          aspectRatio: '16:9',
          ...(model === 'gemini-3.1-flash-image' ? { imageSize: '1K' } : {}),
        },
      },
    }

    const response = await ai.models.generateContent({
      model,
      contents: [prompt],
      config,
    })

    const candidate = response.candidates?.[0]
    const parts = candidate?.content?.parts || []
    const imagePart = parts.find((part: any) => part?.inlineData?.data)
    const data = imagePart?.inlineData?.data
    const mimeType = imagePart?.inlineData?.mimeType || 'image/png'

    if (!data) {
      throw new Error(`Gemini image response did not include image bytes for ${model}`)
    }

    return {
      bytes: Buffer.from(data, 'base64'),
      mimeType,
      filename: `blog-${Date.now()}.png`,
    }
  } catch (err) {
    console.warn(`[image] Google Gemini image failed for ${model}:`, err)
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate blog cover image with automatic fallback chain
 *
 * Tries in order:
 * 1. Gemini image models (only when BLOG_IMAGE_SKIP_GEMINI != true AND billing is enabled)
 * 2. Cloudflare Workers AI — requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
 * 3. Custom image API (if BLOG_IMAGE_API_URL is set)
 * 4. Pollinations free API (no auth, always available)
 * 5. Local SVG fallback
 *
 * Note: Cloudflare compat gateway does NOT support image generation (text LLMs only).
 * Note: Gemini image models (3.1-flash-image, 3.1-flash-lite-image) became paid-only on 2026-07-16.
 *       Enable by setting BLOG_IMAGE_SKIP_GEMINI=false and adding billing to your Google AI project.
 */
function is429(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.status === 429) return true
    const msg = typeof e.message === 'string' ? e.message : ''
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) return true
  }
  return false
}

export async function generateBlogCoverImage(imagePrompt: string): Promise<GeneratedImagePayload> {
  const stylePreset = selectRandomImageStyle()
  const enhancedPrompt = `${stylePreset}, ${imagePrompt}, high quality, sharp focus, professional color grading, teal and slate color palette, no text, no words, no typography, no illustrations, photorealistic, 8k resolution`
  // Gemini image models are paid-only as of 2026-07-16. Skip unless billing is confirmed enabled.
  const skipGemini = process.env.BLOG_IMAGE_SKIP_GEMINI !== 'false'

  const providers = [
    ...(!skipGemini ? [
      { name: 'Gemini 3.1 Flash Image', fn: () => tryGoogleGeminiImage(enhancedPrompt, getPrimaryGoogleImageModel()) },
      { name: 'Gemini 3.1 Flash Lite Image', fn: () => tryGoogleGeminiImage(enhancedPrompt, getSecondaryGoogleImageModel()) },
    ] : []),
    { name: 'Cloudflare Workers AI', fn: () => tryCloudflareWorkersAi(enhancedPrompt) },
    { name: 'Custom Image API', fn: () => tryCustomImageApi(enhancedPrompt) },
    { name: 'Pollinations Fallback', fn: () => tryPollinationsFallback(enhancedPrompt) },
  ]

  for (const provider of providers) {
    try {
      console.log(`[image] Trying ${provider.name}...`)
      const result = await provider.fn()
      if (result) {
        console.log(`[image] Success with ${provider.name}`)
        return result
      }
    } catch (err) {
      if (is429(err)) {
        console.warn(`[image] ${provider.name} quota exhausted (429) — skipping`)
      } else {
        console.warn(`[image] ${provider.name} failed:`, err)
      }
      continue
    }
  }

  console.warn('[image] All image providers exhausted, using SVG fallback')
  return createFallbackCoverImagePayload(imagePrompt, 'All image generation providers failed')
}

export type { GeneratedImagePayload }
