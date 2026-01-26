import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> } // Params are a Promise in Next.js 15+, or just object in older. Next 16 mentioned in instructions? Layout says Next.js 16.
  // In Next.js 15/16 params are asynchronous.
) {
  try {
    const { email } = await params
    const decodedEmail = decodeURIComponent(email)

    if (!decodedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: decodedEmail }
    })

    if (!user) {
      // Return success even if user not found to prevent enumeration, or return 404? 
      // User prompt: "send the reset code so user can reset the password".
      // Usually generic success is better security practice.
      // But for this specific assistant task, maybe they want to know? 
      // I'll stick to the pattern in existing `forgot-password` which returns "success: true" but doesn't error if user not found (security).
      // Actually `forgot-password` returns success: true, message: 'If account exists...'
      return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset code has been sent.' })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store verification code
    // Clean up old codes first
    await prisma.verification.deleteMany({ where: { userId: user.id } })
    
    await prisma.verification.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    })

    // Send email
    try {
      await EmailService.sendPasswordReset(decodedEmail, code)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent successfully' })

  } catch (error) {
    console.error('Error in reset-password route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
