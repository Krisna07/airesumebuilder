import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'

// Rate limiting constants
const MAX_RESEND_ATTEMPTS = 3
const RESEND_LOCKOUT_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const CODE_EXPIRY_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Get existing verification record
    const existing = await prisma.verification.findFirst({ where: { userId: user.id } })

    // Check for rate limiting (resend lockout)
    if (existing?.resendLockedUntil && new Date(existing.resendLockedUntil) > new Date()) {
      const lockedUntil = new Date(existing.resendLockedUntil)
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many resend attempts. Try again in ${minutesLeft} minutes` },
        { status: 429 }
      )
    }

    // Check and increment resend attempts
    let resendAttempts = existing?.resendAttempts || 0

    // Reset resend attempts if lockout period has expired
    if (existing?.resendLockedUntil && new Date(existing.resendLockedUntil) <= new Date()) {
      resendAttempts = 0
    }

    // Check if resend limit is reached
    if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + RESEND_LOCKOUT_DURATION)

      // Update the verification record with lockout
      if (existing) {
        await prisma.verification.update({
          where: { id: existing.id },
          data: {
            resendAttempts: resendAttempts + 1,
            resendLockedUntil: lockedUntil
          }
        })
      }

      const minutesLeft = Math.ceil(RESEND_LOCKOUT_DURATION / 60000)
      return NextResponse.json(
        { error: `Too many resend attempts. Try again in ${minutesLeft} minutes` },
        { status: 429 }
      )
    }

    // Generate new verification code with fresh expiration
    const code = genCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_DURATION)

    // Upsert verification record
    if (existing) {
      await prisma.verification.update({
        where: { id: existing.id },
        data: {
          code,
          expiresAt,
          resendAttempts: resendAttempts + 1,
          // Reset failed attempts since user requested new code
          failedAttempts: 0,
          lockedUntil: null
        }
      })
    } else {
      await prisma.verification.create({
        data: {
          userId: user.id,
          code,
          expiresAt,
          resendAttempts: 1
        }
      })
    }

    // Send verification email
    try {
      await EmailService.sendVerificationCode(user.email!, user.name || '', code)
    } catch (e) {
      console.error('Failed to send verification email', e)
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    console.error('Error resending verification:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
