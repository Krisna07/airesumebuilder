import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'
import { buildWelcomeEmail } from '../newuser/welcomeEmail'

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step, email, code } = body as {
      step?: 'verify' | 'resend' | 'status'
      email?: string
      code?: string
    }

    if (step === 'verify' || !step) {
      if (!email || !code) {
        return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const verification = await prisma.verification.findFirst({ where: { userId: user.id, code } })
      if (!verification) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
      }

      if (new Date(verification.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Code expired' }, { status: 400 })
      }

      const emailContent = buildWelcomeEmail(user.name || email.split('@')[0])
      await prisma.user.update({ where: { email }, data: { isVerified: true } })
      const emailResponse = await EmailService.sendEmail(email, emailContent.subject, emailContent.text, emailContent.html)
      if (emailResponse && 'error' in emailResponse) {
        console.error('Failed to send welcome email:', emailResponse.error)
      }
      await prisma.verification.delete({ where: { id: verification.id } })

      return NextResponse.json({ ok: true })
    }

    if (step === 'resend') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const newCode = genCode()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      const existing = await prisma.verification.findFirst({ where: { userId: user.id } })
      if (existing) {
        await prisma.verification.update({ where: { id: existing.id }, data: { code: newCode, expiresAt } })
      } else {
        await prisma.verification.create({ data: { userId: user.id, code: newCode, expiresAt } })
      }

      try {
        await EmailService.sendVerificationCode(user.email!, user.name || '', newCode)
      } catch (e) {
        console.error('Failed to send verification email', e)
        return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, expiresAt })
    }

    if (step === 'status') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const verification = await prisma.verification.findFirst({ where: { userId: user.id } })
      return NextResponse.json({ ok: true, verification: verification ? { expiresAt: verification.expiresAt } : null })
    }

    return NextResponse.json({ error: 'Invalid step parameter' }, { status: 400 })
  } catch (err) {
    console.error('Error in email verification:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
