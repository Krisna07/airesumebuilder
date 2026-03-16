import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/lib/blogAuth'
import { createBlogSchema } from '@/lib/blogValidation'
import { createBlog } from '@/services/blogCmsService'

export const runtime = 'nodejs'

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
    console.error('POST /api/createBlog failed', error)
    return NextResponse.json({ success: false, error: 'Failed to create blog' }, { status: 500 })
  }
}
