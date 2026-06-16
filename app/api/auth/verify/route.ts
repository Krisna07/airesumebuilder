import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'
import { buildWelcomeEmail } from '../newuser/welcomeEmail'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Find the most recent verification record for this user
    const verification = await prisma.verification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    if (!verification) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Check if user is locked out (Requirement 2.5)
    if (verification.lockedUntil && new Date(verification.lockedUntil) > new Date()) {
      const lockedUntil = new Date(verification.lockedUntil)
      const now = new Date()
      const remainingMs = lockedUntil.getTime() - now.getTime()
      const remainingMinutes = Math.ceil(remainingMs / 60000)
      return NextResponse.json({
        error: `Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
        lockedUntil: lockedUntil.toISOString(),
        retryAfter: remainingMs
      }, { status: 429 })
    }

    // Check if code is expired
    if (new Date(verification.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }

    // Verify the code
    if (verification.code !== code) {
      // Increment failed attempts (Requirement 2.4)
      const newFailedAttempts = verification.failedAttempts + 1

      // Check if we should lock the account (Requirement 2.5)
      let lockedUntil = null
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      }

      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          failedAttempts: newFailedAttempts,
          lockedUntil
        }
      })

      if (lockedUntil) {
        return NextResponse.json({
          error: 'Too many failed attempts. You are locked out for 15 minutes.',
          lockedUntil: lockedUntil.toISOString(),
          retryAfter: LOCKOUT_DURATION_MS
        }, { status: 429 })
      }

      return NextResponse.json({
        error: 'Invalid code',
        remainingAttempts: MAX_FAILED_ATTEMPTS - newFailedAttempts
      }, { status: 400 })
    }

    // Code is valid - verify the user
    const emailContent = buildWelcomeEmail(user.name || email.split('@')[0])

    // Use transaction to atomically update user and delete verification
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          ttl: null // Clear the ttl field as per requirements
        }
      }),
      prisma.verification.delete({ where: { id: verification.id } })
    ])

    const emailResponse = await EmailService.sendEmail(email, emailContent.subject, emailContent.text, emailContent.html)
    if (emailResponse && 'error' in emailResponse) {
      console.error('Failed to send welcome email:', emailResponse.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error verifying user:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}