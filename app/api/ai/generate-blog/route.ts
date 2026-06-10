import { NextResponse } from 'next/server'
import { OpenRouter } from '@openrouter/sdk'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { streamBlogHtmlPrompt, blogMetaPrompt } from '@/lib/prompts'
import {
  OPENROUTER_FAST_MODEL,
  OPENROUTER_STRONG_LONG_CONTEXT_MODEL,
} from '@/services/aiModelConfig'
import {
  generateBlogDraftFromTitle,
} from '@/services/blogAutomationService'
import { generateBlogCoverImage } from '@/services/imageGenerationService'
import { saveImage } from '@/services/blogCmsService'
import { parseStructuredJson } from '@/services/aiProviderUtils'

// Image style presets with brand color integration (teal/slate palette)
const IMAGE_STYLE_PRESETS = [
  {
    name: 'modern-workspace',
    description: 'Modern minimalist office workspace with laptop and documents, teal accent lighting, slate gray surfaces, natural window light, shallow depth of field, professional photography, clean aesthetic, corporate environment',
  },
  {
    name: 'professional-desk',
    description: 'Professional business desk setup with resume documents, teal colored notebook or accessories, slate gray background, soft studio lighting, high-quality photography, contemporary office interior, sharp focus',
  },
  {
    name: 'tech-workspace',
    description: 'Contemporary tech workspace with computer screen, teal ambient lighting, slate colored desk and walls, natural lighting from window, photorealistic, modern corporate aesthetic, professional photography',
  },
  {
    name: 'career-concept',
    description: 'Professional career development concept, business documents on clean desk, teal and slate color scheme, natural daylight, shallow depth of field, high-end photography, modern minimalist style',
  },
  {
    name: 'office-interior',
    description: 'Modern office interior with professional workspace, teal accent wall or decor, slate gray furniture, natural lighting, photorealistic photography, clean lines, corporate environment, 8k quality',
  },
]

function selectRandomImageStyle(): string {
  const randomIndex = Math.floor(Math.random() * IMAGE_STYLE_PRESETS.length)
  return IMAGE_STYLE_PRESETS[randomIndex].description
}

export const runtime = 'nodejs'

const openRouter = process.env.OPENROUTER_API_KEY
  ? new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
  : null

function getMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        }
        return ''
      })
      .join('')
  }
  return ''
}

/**
 * GET /api/ai/generate-blog?title=...
 * SSE stream with three event types:
 *   { meta: { title, excerpt } }   — emitted first, fills the editor meta fields
 *   { text: "html fragment" }      — streamed body chunks
 *   { coverImage: { id, url } }    — emitted after body, optional (non-fatal)
 *   { done: true }                 — final event
 *   { error: "message" }           — on failure
 */

export async function GET(req: Request) {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('title')?.trim() || ''

  if (!topic || topic.length < 3) {
    return NextResponse.json(
      { success: false, error: 'Title must be at least 3 characters.' },
      { status: 400 }
    )
  }

  if (!openRouter) {
    return NextResponse.json(
      { success: false, error: 'OPENROUTER_API_KEY not configured.' },
      { status: 500 }
    )
  }

  const encoder = new TextEncoder()


  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))

      try {
        // ── Step 1: Generate title + excerpt (non-streaming, fast) ─────────────
        let derivedTitle = topic
        let excerpt = ''
        try {
          const metaRes = await openRouter.chat.send({
            model: OPENROUTER_FAST_MODEL,
            messages: [{ role: 'user', content: blogMetaPrompt(topic) }],
            temperature: 0.95,
            stream: false,
          })
          const metaText = getMessageContent(metaRes?.choices?.[0]?.message?.content)
          const meta = parseStructuredJson(metaText, 'OpenRouter') as {
            title?: string
            excerpt?: string
          }
          if (meta.title && topic.length <= 25) {
            derivedTitle = meta.title
          }
          if (meta.excerpt) excerpt = meta.excerpt
        } catch {
          // Non-fatal — fall back to the raw topic as title
        }
        send({ meta: { title: derivedTitle, excerpt } })

        // ── Step 2: Stream HTML body ────────────────────────────────────────────
        const bodyRes = await openRouter.chat.send({
          model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL,
          messages: [{ role: 'user', content: streamBlogHtmlPrompt(derivedTitle) }],
          temperature: 0.85,
          stream: false,
        })

        const html = getMessageContent(bodyRes?.choices?.[0]?.message?.content)
        for (let i = 0; i < html.length; i += 1200) {
          const text = html.slice(i, i + 1200)
          if (text) send({ text })
        }

        // ── Step 3: Generate cover image (non-fatal) ───────────────────────────
        try {
          const selectedStyle = selectRandomImageStyle()
          const imagePrompt = `${selectedStyle} for "${derivedTitle}". Professional career development concept. ABSOLUTELY NO TEXT, NO TYPOGRAPHY, NO LETTERS, NO WORDS, NO ILLUSTRATIONS, NO CARTOONS in the image whatsoever. Photorealistic only.`
          const imagePayload = await generateBlogCoverImage(imagePrompt)
          const imageMeta = await saveImage({
            bytes: imagePayload.bytes,
            mimeType: imagePayload.mimeType,
            filename: imagePayload.filename,
            actor: { userId: admin.session.userId, email: admin.session.email },
          })
          send({ coverImage: { id: imageMeta.id, url: imageMeta.url } })
        } catch (imgErr) {
          console.warn('Cover image generation failed (non-fatal):', imgErr instanceof Error ? imgErr.message : imgErr)
        }

        send({ done: true })
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream failed'
        send({ error: message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const targetKeywords = Array.isArray(body.targetKeywords)
      ? body.targetKeywords.filter((k: unknown): k is string => typeof k === 'string')
      : []

    if (!title || title.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 3 characters.' },
        { status: 400 }
      )
    }

    const draft = await generateBlogDraftFromTitle(title, targetKeywords)

    // The image generation function now handles random style selection internally
    const imagePayload = await generateBlogCoverImage(draft.imagePrompt)

    const imageMeta = await saveImage({
      bytes: imagePayload.bytes,
      mimeType: imagePayload.mimeType,
      filename: imagePayload.filename,
      actor: {
        userId: admin.session.userId,
        email: admin.session.email,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        title: draft.title,
        excerpt: draft.excerpt,
        slug: draft.slug,
        sections: draft.sections,
        status: draft.status,
        author: draft.author,
        coverImageId: imageMeta.id,
        coverImageUrl: imageMeta.url,
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate-blog failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI blog generation failed',
      },
      { status: 500 }
    )
  }
}
