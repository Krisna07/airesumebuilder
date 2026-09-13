import { NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { requireAdminOrForbidden } from '@/services/authService'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const appKey = process.env.TWITTER_CONSUMER_KEY
  const appSecret = process.env.TWITTER_CONSUMER_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return NextResponse.json({
      connected: false,
      error: 'Missing TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, or TWITTER_ACCESS_TOKEN_SECRET.',
    })
  }

  const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret })

  try {
    const me = await client.v2.me()
    return NextResponse.json({
      connected: true,
      username: me.data.username,
      name: me.data.name,
    })
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
