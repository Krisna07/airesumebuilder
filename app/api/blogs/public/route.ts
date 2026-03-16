import { NextResponse } from 'next/server'
import { listPublishedBlogs } from '@/services/blogCmsService'

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
    console.error('GET /api/blogs/public failed', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 })
  }
}
