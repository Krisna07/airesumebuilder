import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/services/twitterService'
import { requireAdminOrForbidden } from '@/services/authService'

export const runtime = 'nodejs'

const SCOPES = ['tweet.write', 'users.read', 'offline.access', 'media.write']

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/twitter/callback`
  const client = getOAuthClient()

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(callbackUrl, {
    scope: SCOPES,
  })

  const response = NextResponse.redirect(url)
  // Store verifier + state in short-lived cookies for the callback
  response.cookies.set('tw_code_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' })
  response.cookies.set('tw_state', state, { httpOnly: true, maxAge: 600, path: '/' })

  return response
}
