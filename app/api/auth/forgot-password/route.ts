import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/services/emailService'


export async function POST(req: Request) {
  const body = await req.json()
  const { email } = body as { email?: string }

  // Get email from session if not provided (logged-in user)
  let userEmail = email
  if (!userEmail) {
    const session = await getServerSession(authOptions)
    userEmail = session?.user?.email
  }

  if (!userEmail) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    // Don't reveal if email exists for security
    return NextResponse.json({ success: true, message: 'If account exists, verification code sent to email' })
  }

  if (user.provider && user.provider !== 'credentials') {
    return NextResponse.json({ error: 'Password reset is not available for SSO accounts. Sign in with your provider.' }, { status: 400 })
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Store verification code (reuse Verification model)
  await prisma.verification.deleteMany({ where: { userId: user.id } })
  await prisma.verification.create({
    data: {
      userId: user.id,
      code,
      expiresAt,
    },
  })

  // Send email with code
  try {

    await EmailService.sendPasswordReset(userEmail, code)
  } catch (err) {
    console.error('Failed to send password reset email:', err)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Verification code sent to email' })
}
