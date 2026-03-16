import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { imageUploadSchema } from '@/lib/blogValidation'
import { saveImage } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 })
    }

    const maxBytes = Number(process.env.BLOG_IMAGE_MAX_BYTES || 5 * 1024 * 1024)
    if (file.size > maxBytes) {
      return NextResponse.json({ success: false, error: 'Image exceeds allowed size' }, { status: 400 })
    }

    const validated = imageUploadSchema.safeParse({
      mimeType: file.type,
      size: file.size,
    })

    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0]?.message || 'Invalid image' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    const meta = await saveImage({
      bytes,
      mimeType: file.type,
      filename: file.name,
      actor: {
        userId: admin.session.userId,
        email: admin.session.email,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        imageId: meta.id,
        url: `/api/blog-images/${meta.id}`,
        mimeType: meta.mimeType,
        sourceUrl: meta.url,
      },
    })
  } catch (error) {
    console.error('POST /api/blog-images failed', error)
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 })
  }
}
