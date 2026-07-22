import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetCountsData, shouldResetForPlan } from '@/lib/subscription'
import { requireUserSession, mapSubscriptionError } from '@/lib/subscription-server'

export async function GET() {
  let resolved
  try {
    resolved = await requireUserSession()
  } catch (err) {
    const mapped = mapSubscriptionError(err)
    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
  }

  let sub = await prisma.subscription.findUnique({ where: { userId: resolved.userId } })
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId: resolved.userId, plan: 'FREE', ...resetCountsData() },
    })
  } else if (shouldResetForPlan(sub.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE', sub.lastResetDate)) {
    sub = await prisma.subscription.update({
      where: { userId: resolved.userId },
      data: resetCountsData(),
    })
  }

  // Fetch lifetime usage history
  let usageHistory = await prisma.usageHistory.findUnique({ where: { userId: resolved.userId } })
  if (!usageHistory) {
    usageHistory = await prisma.usageHistory.create({
      data: {
        userId: resolved.userId,
        regenTotal: 0,
        downloadTotal: 0,
        clTotal: 0,
        analysisTotal: 0,
        uploadTotal: 0,
      },
    })
  }

  return NextResponse.json({ ...sub, usageHistory })
}

export async function POST(req: Request) {
  let resolved
  try {
    resolved = await requireUserSession()
  } catch (err) {
    const mapped = mapSubscriptionError(err)
    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
  }
  const body = await req.json()
  const plan = body?.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE' | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {}
  if (plan) data.plan = plan

  const sub = await prisma.subscription.upsert({
    where: { userId: resolved.userId },
    create: { userId: resolved.userId, plan: plan ?? 'FREE', ...resetCountsData() },
    update: data,
  })

  return NextResponse.json(sub)
}
