import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { resetCountsData, shouldResetForPlan } from '@/lib/subscription'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let sub = await prisma.subscription.findUnique({ where: { userId: user.id } })
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', ...resetCountsData() },
    })
  } else if (shouldResetForPlan(sub.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE', sub.lastResetDate)) {
    sub = await prisma.subscription.update({
      where: { userId: user.id },
      data: resetCountsData(),
    })
  }

  // Fetch lifetime usage history
  let usageHistory = await prisma.usageHistory.findUnique({ where: { userId: user.id } })
  if (!usageHistory) {
    usageHistory = await prisma.usageHistory.create({
      data: {
        userId: user.id,
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const plan = body?.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE' | undefined
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {}
  if (plan) data.plan = plan

  const sub = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: plan ?? 'FREE', ...resetCountsData() },
    update: data,
  })

  return NextResponse.json(sub)
}
