import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { updateBlogSchema } from '@/lib/blogValidation'
import { archiveBlog, updateBlog, touchBlogAuthSession } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const body = await req.json()
    const parsed = updateBlogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      )
    }

    const { id } = await context.params

    const post = await updateBlog(id, parsed.data)
    if (!post) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 })
    }

    await touchBlogAuthSession({
      userId: admin.session.userId,
      email: admin.session.email,
      isAdmin: true,
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('PATCH /api/blogs/[id] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to update blog' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const archived = await archiveBlog(id)
    if (!archived) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 })
    }

    await touchBlogAuthSession({
      userId: admin.session.userId,
      email: admin.session.email,
      isAdmin: true,
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, data: archived })
  } catch (error) {
    console.error('DELETE /api/blogs/[id] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to archive blog' }, { status: 500 })
  }
}
