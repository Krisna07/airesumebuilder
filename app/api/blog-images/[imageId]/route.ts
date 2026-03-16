import { NextResponse } from 'next/server'
import { getImage } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ imageId: string }> }) {
  try {
    const { imageId } = await context.params
    const image = await getImage(imageId)

    if (!image) {
      return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 })
    }

    return new NextResponse(image.bytes, {
      status: 200,
      headers: {
        'Content-Type': image.meta.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('GET /api/blog-images/[imageId] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch image' }, { status: 500 })
  }
}
