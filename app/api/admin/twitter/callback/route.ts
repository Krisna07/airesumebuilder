import { NextRequest, NextResponse } from 'next/server'
import { seedRefreshToken } from '@/services/twitterService'

export const runtime = 'nodejs'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const storedState = req.cookies.get('tw_state')?.value
  const codeVerifier = req.cookies.get('tw_code_verifier')?.value

  if (!code || !state || !codeVerifier || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth callback — state mismatch or missing code.' }, { status: 400 })
  }

  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Twitter credentials not configured.' }, { status: 500 })
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/twitter/callback`
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
      client_type: 'confidential',
    }).toString(),
  })

  const data = await tokenResponse.json() as {
    access_token?: string
    refresh_token?: string
    error?: string
    error_description?: string
  }

  if (!tokenResponse.ok || !data.refresh_token) {
    console.error('[twitter/callback] Token exchange failed:', data)
    return NextResponse.json(
      { error: data.error_description || data.error || 'Token exchange failed. Ensure offline.access scope is requested.' },
      { status: 400 }
    )
  }

  await seedRefreshToken(data.refresh_token)

  const response = NextResponse.json({
    success: true,
    message: 'Twitter connected. Refresh token stored — cron jobs will now post tweets with images.',
  })
  response.cookies.delete('tw_state')
  response.cookies.delete('tw_code_verifier')
  return response
}
