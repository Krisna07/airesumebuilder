import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrForbidden } from '@/services/authService'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const record = await prisma.refreshToken.findUnique({ where: { key: 'default' } })

  if (!record) {
    return NextResponse.json({
      connected: false,
      error: 'No refresh token stored. Visit /api/admin/twitter/connect to authorize.',
    })
  }

  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ connected: false, error: 'TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET not set' }, { status: 500 })
  }

  // Exchange refresh token for a fresh access token
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: record.refreshToken,
      client_type: 'confidential',
    }).toString(),
  })
  const tokenData = await tokenRes.json() as { access_token?: string; scope?: string; error?: string; error_description?: string }

  if (!tokenRes.ok) {
    return NextResponse.json({
      connected: false,
      tokenPreview: record.refreshToken.slice(0, 20) + '…',
      tokenError: tokenData.error,
      tokenErrorDescription: tokenData.error_description,
    })
  }

  const scopes: string[] = (tokenData.scope ?? '').split(' ').filter(Boolean)
  const hasTweetWrite = scopes.includes('tweet.write')
  const hasMediaWrite = scopes.includes('media.write')

  // Verify the token by calling /2/users/me
  const meRes = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const meData = await meRes.json() as { data?: { id: string; username: string; name: string }; errors?: unknown }

  return NextResponse.json({
    connected: meRes.ok,
    username: meData.data?.username ?? null,
    name: meData.data?.name ?? null,
    scopes,
    hasTweetWrite,
    hasMediaWrite,
    readyToPost: hasTweetWrite && hasMediaWrite,
    fix: !hasTweetWrite || !hasMediaWrite
      ? '1) Set app permissions to "Read and Write" in developer.twitter.com → 2) Visit /api/admin/twitter/connect to re-authorize'
      : null,
  })
}
