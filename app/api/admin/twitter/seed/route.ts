import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrForbidden } from '@/services/authService'
import { seedRefreshToken } from '@/services/twitterService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin = await requireAdminOrForbidden()
  if (!admin.ok) return admin.response

  const body = await req.json().catch(() => ({}))
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken.trim() : ''

  if (!refreshToken) {
    return NextResponse.json({ error: 'refreshToken is required' }, { status: 400 })
  }

  await seedRefreshToken(refreshToken)
  return NextResponse.json({ success: true, message: 'Twitter refresh token stored.' })
}
