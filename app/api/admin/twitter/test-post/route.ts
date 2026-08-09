import { NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/services/authService'
import { postBlogTweet } from '@/services/twitterService'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const IMAGE_PATH = path.join(
  'C:\\Users\\krisn\\Downloads\\favicon_io',
  'android-chrome-512x512.png'
)

export async function POST(): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  let imageBuffer: Buffer | undefined
  try {
    imageBuffer = fs.readFileSync(IMAGE_PATH)
  } catch {
    console.warn('[test-post] Could not read local test image, posting text-only')
  }

  const result = await postBlogTweet({
    title: 'Test post from AIResumeCraft',
    excerpt: 'This is a dummy tweet to verify Twitter OAuth and media upload are working correctly.',
    slug: `test-${Date.now()}`,
    imageBuffer,
    imageMimeType: imageBuffer ? 'image/png' : undefined,
  })

  if (result.ok) {
    return NextResponse.json({ success: true, tweetId: result.tweetId })
  }
  return NextResponse.json({ success: false, error: result.error }, { status: 500 })
}
