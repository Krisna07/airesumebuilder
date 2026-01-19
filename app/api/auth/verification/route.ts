import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const verification = await prisma.verification.findFirst({ where: { userId: user.id } })
    if (!verification) return NextResponse.json({ ok: true, verification: null })

    return NextResponse.json({ ok: true, verification: { expiresAt: verification.expiresAt } })
  } catch (err) {
    console.error('Error fetching verification:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
