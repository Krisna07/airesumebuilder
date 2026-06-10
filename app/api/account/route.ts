import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function PATCH(req: Request) {

  const body = await req.json()
  const { email, name, currentPassword, newPassword } = body as {
    email: string
    name?: string
    currentPassword?: string
    newPassword?: string
  }

  const user = await prisma.user.findUnique({ where: { email: email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updateData: { name?: string; password?: string } = {}

  if (typeof name === 'string') {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }
    updateData.name = trimmed
  }

  if (typeof newPassword === 'string' && newPassword.length > 0) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    // If user already has a password, require currentPassword to change it
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
      }
      const ok = await bcrypt.compare(currentPassword, user.password)
      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
    }

    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  if (!updateData.name && !updateData.password) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, email: true, name: true, image: true },
  })

  return NextResponse.json({ user: updated })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { password, confirmText } = body as { password?: string; confirmText?: string }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify confirmation text
  if (confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Confirmation text must be DELETE' }, { status: 400 })
  }

  // ALWAYS require password for account deletion (security requirement)
  if (!password) {
    return NextResponse.json({ error: 'Password required to delete account' }, { status: 400 })
  }

  // Verify password
  if (user.password) {
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }
  } else {
    // OAuth user without password - they should reset password first
    return NextResponse.json({
      error: 'Please set a password before deleting your account. Use "Forgot password?" to set one.'
    }, { status: 400 })
  }

  // Soft delete: mark user as deleted instead of hard delete
  const deleted = await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() }
  })

  // Return success response
  // Frontend will handle calling signOut() to clear the session
  return NextResponse.json({
    success: true,
    message: 'Account deletion initiated (soft delete)',
    deletedUserId: deleted.id
  })
}
