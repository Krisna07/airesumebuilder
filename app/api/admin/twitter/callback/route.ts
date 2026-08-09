import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/services/twitterService'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const TWITTER_TOKEN_KEY = 'twitter'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const storedState = req.cookies.get('tw_state')?.value
  const codeVerifier = req.cookies.get('tw_code_verifier')?.value

  if (!code || !state || !codeVerifier || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth callback' }, { status: 400 })
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/twitter/callback`
  const client = getOAuthClient()

  const { refreshToken } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: callbackUrl,
  })

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token returned. Ensure offline.access scope is requested.' },
      { status: 400 }
    )
  }

  await prisma.refreshToken.upsert({
    where: { key: TWITTER_TOKEN_KEY },
    update: { refreshToken },
    create: { key: TWITTER_TOKEN_KEY, refreshToken },
  })

  const response = NextResponse.json({ success: true, message: 'Twitter connected successfully.' })
  response.cookies.delete('tw_state')
  response.cookies.delete('tw_code_verifier')
  return response
}
