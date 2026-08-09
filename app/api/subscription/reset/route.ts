import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetCountsData } from '@/lib/subscriptionConfig'
import { requireUserSession, mapSubscriptionError } from '@/services/subscriptionService'

export async function POST() {
  let resolved
  try {
    resolved = await requireUserSession()
  } catch (err) {
    const mapped = mapSubscriptionError(err)
    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
  }

  const updated = await prisma.subscription.upsert({
    where: { userId: resolved.userId },
    create: { userId: resolved.userId, plan: 'FREE', ...resetCountsData() },
    update: resetCountsData(),
  })

  return NextResponse.json(updated)
}
