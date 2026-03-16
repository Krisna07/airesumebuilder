import { NextResponse } from 'next/server'
import { getBlogBySlug } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const post = await getBlogBySlug(slug)

    if (!post || post.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('GET /api/blogs/public/[slug] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch blog' }, { status: 500 })
  }
}
