import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const code = genCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Upsert verification record
    const existing = await prisma.verification.findFirst({ where: { userId: user.id } })
    if (existing) {
      await prisma.verification.update({ where: { id: existing.id }, data: { code, expiresAt } })
    } else {
      await prisma.verification.create({ data: { userId: user.id, code, expiresAt } })
    }

    // send email
    try {
      await EmailService.sendWelcomeEmail(user.email!, user.name || '', code)
    } catch (e) {
      console.error('Failed to send verification email', e)
    }

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    console.error('Error resending verification:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
