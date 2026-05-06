import { NextResponse } from 'next/server'
import { getBlogById, listRelatedByKeywords } from '@/services/blogCmsService'

export const runtime = 'nodejs'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format
    if (!id || !id.startsWith('blog_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid blog post ID' },
        { status: 400 }
      )
    }

    // Fetch the current post
    const post = await getBlogById(id)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit') || 5), 1),
      10
    )

    // Get related posts based on keywords
    const relatedPosts = await listRelatedByKeywords(
      post.seoKeywords || [],
      post.id,
      limit
    )

    return NextResponse.json({
      success: true,
      data: {
        relatedPosts,
        count: relatedPosts.length,
      },
    })
  } catch (error) {
    console.error('GET /api/blogs/[id]/related failed', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related posts' },
      { status: 500 }
    )
  }
}