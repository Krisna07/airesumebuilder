import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { streamBlogHtmlPrompt, blogMetaPrompt } from '@/lib/prompts'
import {
  generateBlogDraftFromTitle,
  generateCoverImageFromPrompt,
} from '@/services/blogAutomationService'
import { saveImage } from '@/services/blogCmsService'

export const runtime = 'nodejs'

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

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json(
      { success: false, error: 'GEMINI_API_KEY not configured.' },
      { status: 500 }
    )
  }

  const genAI = new GoogleGenAI({ apiKey: geminiKey })
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
          const metaRes = await genAI.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [{ role: 'user', parts: [{ text: blogMetaPrompt(topic) }] }],
            config: { temperature: 0.95 },
          })
          const metaText = metaRes.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? '')
            .join('') ?? ''
          const cleaned = metaText.replace(/```json\s*|\s*```/g, '').trim()
          const meta = JSON.parse(cleaned) as { title?: string; excerpt?: string }
          if (meta.title && topic.length <= 25) {
            derivedTitle = meta.title
          }
          if (meta.excerpt) excerpt = meta.excerpt
        } catch {
          // Non-fatal — fall back to the raw topic as title
        }
        send({ meta: { title: derivedTitle, excerpt } })

        // ── Step 2: Stream HTML body ────────────────────────────────────────────
        const responseStream = await genAI.models.generateContentStream({
          model: 'gemini-3.1-flash-lite-preview',
          contents: [{ role: 'user', parts: [{ text: streamBlogHtmlPrompt(derivedTitle) }] }],
          config: { temperature: 0.85 },
        })

        for await (const chunk of responseStream) {
          const text =
            chunk.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text ?? '')
              .join('') ?? ''
          if (text) send({ text })
        }

        // ── Step 3: Generate cover image (non-fatal) ───────────────────────────
        try {
          const imagePrompt = `Flat vector illustration, SaaS isometric style, clean minimalist tech blog cover for "${derivedTitle}". Digital career concept. Teal and slate color palette. ABSOLUTELY NO TEXT, NO TYPOGRAPHY, NO LETTERS, AND NO WORDS in the image whatsoever.`
          const imagePayload = await generateCoverImageFromPrompt(imagePrompt)
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

    if (!title || title.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 3 characters.' },
        { status: 400 }
      )
    }

    const draft = await generateBlogDraftFromTitle(title)
    const imagePayload = await generateCoverImageFromPrompt(draft.imagePrompt)

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
