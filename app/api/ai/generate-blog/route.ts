import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import {
  generateBlogDraftFromTitle,
  generateCoverImageFromPrompt,
} from '@/services/blogAutomationService'
import { saveImage } from '@/services/blogCmsService'

export const runtime = 'nodejs'

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
