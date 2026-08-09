import { NextResponse } from 'next/server'
import { getImage } from '@/services/blogCmsService'
import { requireAdminOrForbidden } from '@/services/authService'
import { deleteImage } from '@/services/blogCmsService'

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

export async function DELETE(_req: Request, context: { params: Promise<{ imageId: string }> }) {
  try {
    const admin = await requireAdminOrForbidden()
    if (!admin.ok) return admin.response

    const { imageId } = await context.params
    const ok = await deleteImage(imageId)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/blog-images/[imageId] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
  }
}
