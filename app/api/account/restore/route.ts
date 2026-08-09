import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireUserSession, mapSubscriptionError } from '@/services/subscriptionService'

/**
 * Restore a deleted account within the 15-day grace period
 * User must provide password to verify account ownership
 */
export async function POST(req: Request) {
  let sessionUserId: string
  try {
    ; ({ userId: sessionUserId } = await requireUserSession())
  } catch (err) {
    const mapped = mapSubscriptionError(err)
    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
  }

  const body = await req.json()
  const { password } = body as { password?: string }

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check if account is deleted
  if (!user.deletedAt) {
    return NextResponse.json({ error: 'Account is not deleted' }, { status: 400 })
  }

  // Check if grace period has expired (15 days from deletion)
  const GRACE_PERIOD_DAYS = 15;
  const deletionDate = new Date(user.deletedAt);
  const expirationDate = new Date(deletionDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now > expirationDate) {
    return NextResponse.json({
      error: 'Grace period has expired. Account cannot be restored.',
      status: 410
    }, { status: 410 })
  }

  // Verify password for credentials users
  if (user.password) {
    if (!password) {
      return NextResponse.json({ error: 'Password required to restore account' }, { status: 400 })
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }
  }

  // Restore the account by clearing deletion timestamp
  const restored = await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Account restored successfully',
    user: restored,
  })
}
