import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { resetCountsData, shouldResetDaily } from '@/lib/subscription'

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let sub = await prisma.subscription.findUnique({ where: { userId: user.id } })
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', ...resetCountsData() },
    })
  } else if (shouldResetDaily(sub.lastResetDate)) {
    sub = await prisma.subscription.update({
      where: { userId: user.id },
      data: resetCountsData(),
    })
  }
  return NextResponse.json(sub)
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const plan = body?.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE' | undefined
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const data: any = {}
  if (plan) data.plan = plan

  const sub = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: plan ?? 'FREE' },
    update: data,
  })

  return NextResponse.json(sub)
}
