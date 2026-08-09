import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/services/authService'
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

    // allow uploads to be attached to a specific blog draft by passing `blogId` in the form
    const maybeBlogId = String(form.get('blogId') ?? '').trim() || undefined

    let targetBlogId = maybeBlogId

    // If no blogId provided, create a minimal draft blog and attach uploads to it
    if (!targetBlogId) {
      // lazy-create a draft blog
      const { createBlog } = await import('@/services/blogCmsService')
      const draft = await createBlog(
        {
          title: 'Untitled',
          excerpt: '',
          author: admin.session.email || 'unknown',
          sections: [],
          status: 'draft',
        },
        {
          userId: admin.session.userId,
          email: admin.session.email,
        }
      )

      targetBlogId = draft.id
    }

    // sanitize filename and prefix with blog id so assets are grouped by blog
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${targetBlogId}_${safeName}`

    const meta = await saveImage({
      bytes,
      mimeType: file.type,
      filename,
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
        blogId: targetBlogId,
      },
    })
  } catch (error) {
    console.error('POST /api/blog-images failed', error)
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 })
  }
}
