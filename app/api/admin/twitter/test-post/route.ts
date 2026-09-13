import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/services/authService'
import { postBlogTweet } from '@/services/twitterService'
import { generateBlogCoverImage } from '@/services/imageGenerationService'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const IMAGE_PATH = path.join(
  'C:\\Users\\krisn\\Downloads\\favicon_io',
  'android-chrome-512x512.png'
)

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const title = typeof body.title === 'string' ? body.title : 'Test post from AIResumeCraft'
  const excerpt = typeof body.excerpt === 'string' ? body.excerpt : 'This is a dummy tweet to verify Twitter OAuth and media upload are working correctly.'
  const slug = typeof body.slug === 'string' ? body.slug : `test-${Date.now()}`
  const useRealImage = body.useRealImage === true
  const noImage = body.noImage === true

  let imageBuffer: Buffer | undefined
  let imageMimeType: string | undefined

  if (noImage) {
    // leave undefined — text-only post
  } else if (useRealImage) {
    const generated = await generateBlogCoverImage(typeof body.imagePrompt === 'string' ? body.imagePrompt : title)
    imageBuffer = generated.bytes
    imageMimeType = generated.mimeType
  } else {
    try {
      imageBuffer = fs.readFileSync(IMAGE_PATH)
      imageMimeType = 'image/png'
    } catch {
      console.warn('[test-post] Could not read local test image, posting text-only')
    }
  }

  const result = await postBlogTweet({ title, excerpt, slug, imageBuffer, imageMimeType })

  if (result.ok) {
    return NextResponse.json({ success: true, tweetId: result.tweetId })
  }
  return NextResponse.json({ success: false, error: result.error }, { status: 500 })
}
