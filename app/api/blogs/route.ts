import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { createBlogSchema } from '@/lib/blogValidation'
import { createBlog, listPublishedBlogs } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') || 20)
    const offset = Number(searchParams.get('offset') || 0)

    const data = await listPublishedBlogs({
      limit: Number.isNaN(limit) ? 20 : Math.min(limit, 50),
      offset: Number.isNaN(offset) ? 0 : Math.max(offset, 0),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/blogs failed', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const body = await req.json()
    const parsed = createBlogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      )
    }

    const post = await createBlog(parsed.data, {
      userId: admin.session.userId,
      email: admin.session.email,
    })

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error) {
    console.error('POST /api/blogs failed', error)
    return NextResponse.json({ success: false, error: 'Failed to create blog' }, { status: 500 })
  }
}
