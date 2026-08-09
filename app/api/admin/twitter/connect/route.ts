import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/services/authService'

export const runtime = 'nodejs'

// Required scopes:
// - tweet.write   → post tweets
// - media.write   → upload images
// - users.read    → read user profile (required by Twitter for user context)
// - offline.access → get a refresh token (otherwise only access token is returned)
const SCOPES = 'tweet.write media.write users.read offline.access'

function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const arr = new Uint8Array(64)
  crypto.getRandomValues(arr)
  for (const byte of arr) result += chars[byte % chars.length]
  return result
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function generateState(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Buffer.from(arr).toString('hex')
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const clientId = process.env.TWITTER_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not set' }, { status: 500 })
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/twitter/callback`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('tw_code_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' })
  response.cookies.set('tw_state', state, { httpOnly: true, maxAge: 600, path: '/' })
  return response
}
