import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: Request) {
  const body = await req.json()
  const { email, code, newPassword, oldPassword } = body as {
    email?: string
    code?: string
    newPassword?: string
    oldPassword?: string
  }

  if (!code || !newPassword) {
    return NextResponse.json({ error: 'Code and new password are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Determine user context: logged-in or not
  let userEmail = email
  const session = await getServerSession(authOptions)
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
  

  // Verify code
  const verification = await prisma.verification.findFirst({
    where: { userId: user.id, code },
  })

  if (!verification) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  if (new Date() > verification.expiresAt) {
    return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
  }

  // If logged in and user has password, verify old password
  if (isLoggedIn && user.password) {
    if (!oldPassword) {
      return NextResponse.json({ error: 'Old password is required when logged in' }, { status: 400 })
    }
    const ok = await bcrypt.compare(oldPassword, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 })
    }
  }

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  // Delete used verification code
  await prisma.verification.delete({ where: { id: verification.id } })

  return NextResponse.json({ success: true, message: 'Password reset successfully' })
}
