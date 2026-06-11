import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/utils/sendEmail'

export async function POST(req: Request) {
  const body = await req.json()
  const { step, email, code, newPassword, oldPassword } = body as {
    step?: 'send-code' | 'reset'
    email?: string
    code?: string
    newPassword?: string
    oldPassword?: string
  }

  const session = await getServerSession(authOptions)

  if (step === 'send-code' || !step) {
    let userEmail = email
    if (!userEmail) {
      userEmail = session?.user?.email
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) {
      return NextResponse.json({ success: true, message: 'If account exists, verification code sent to email' })
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.verification.deleteMany({ where: { userId: user.id } })
    await prisma.verification.create({
      data: {
        userId: user.id,
        code: resetCode,
        expiresAt,
      },
    })

    try {
      await EmailService.sendPasswordReset(userEmail, resetCode)
    } catch (err) {
      console.error('Failed to send password reset email:', err)
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to email' })
  }

  if (step === 'reset') {
    if (!code || !newPassword) {
      return NextResponse.json({ error: 'Code and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    let userEmail = email
    const isLoggedIn = !!session?.user?.email

    if (!userEmail) {
      if (isLoggedIn) {
        userEmail = session?.user?.email
      } else {
        return NextResponse.json({ error: 'Email is required for logged-out reset' }, { status: 400 })
      }
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const verification = await prisma.verification.findFirst({
      where: { userId: user.id, code },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
    }

    if (isLoggedIn && user.password) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Old password is required when logged in' }, { status: 400 })
      }
      const ok = await bcrypt.compare(oldPassword, user.password)
      if (!ok) {
        return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await prisma.verification.delete({ where: { id: verification.id } })

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  }

  return NextResponse.json({ error: 'Invalid step parameter' }, { status: 400 })
}
