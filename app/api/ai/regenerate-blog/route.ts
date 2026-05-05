import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { polishBlogPrompt } from '@/lib/prompts'
import { parseResponse } from '@/lib/jsonParse'
import { GoogleGenAI } from '@google/genai'
import { OpenRouter } from '@openrouter/sdk'
import { z } from 'zod'

export const runtime = 'nodejs'

const requestSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  // Expect array of objects (records with string keys)
  sections: z.array(z.record(z.string(), z.unknown())).min(1),
})

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null
const openRouter = process.env.OPENROUTER_API_KEY
  ? new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
  : null

async function callAI(prompt: string): Promise<string> {
  if (genAI) {
    try {
      const res = await genAI.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      const raw =
        res?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || ''
      if (raw) return raw
    } catch {
      // fall through to OpenRouter
    }
  }
  if (openRouter) {
    const res = await openRouter.chat.send({
      model: 'google/gemini-3.1-flash-lite-001:free',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    })
    const content = res?.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenRouter')
    return typeof content === 'string' ? content : JSON.stringify(content)
  }
  throw new Error('No AI client available. Check GEMINI_API_KEY or OPENROUTER_API_KEY.')
}

/**
 * POST /api/ai/regenerate-blog
 * Polishes a blog draft: fixes spelling/grammar and adds SEO keywords.
 * Body: { title, excerpt, sections }
 * Returns: { title, excerpt, seoKeywords, sections }
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      )
    }

    const { title, excerpt, sections } = parsed.data
    const prompt = polishBlogPrompt(title, excerpt, sections)
    const raw = await callAI(prompt)

    const result = parseResponse(raw) as {
      title?: string
      excerpt?: string
      seoKeywords?: string[]
      sections?: unknown[]
    }

    if (!result || !Array.isArray(result.sections)) {
      return NextResponse.json(
        { success: false, error: 'AI returned an unexpected format. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        title: result.title || title,
        excerpt: result.excerpt || excerpt,
        seoKeywords: Array.isArray(result.seoKeywords) ? result.seoKeywords : [],
        sections: result.sections,
      },
    })
  } catch (error) {
    console.error('POST /api/ai/regenerate-blog (polish) failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Regeneration failed',
      }
    )
  }
}
