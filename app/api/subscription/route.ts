import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getQuotaForPlan, resetCountsData, shouldResetDaily, shouldResetForPlan, UsageKey } from '@/lib/subscription'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

type Payload = {
  action?: 'set-plan' | 'increment'
  plan?: 'FREE' | 'SUPPORTER' | 'ULTIMATE'
  key?: UsageKey
  amount?: number
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string) {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count += 1
  return true
}

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

  const body: Payload = await req.json()
  const action = body?.action || 'set-plan'

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (action === 'set-plan') {
    const plan = body?.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE' | undefined

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

  if (action === 'increment') {
    if (!body?.key) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    let sub = await prisma.subscription.findUnique({ where: { userId: user.id } })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    if (shouldResetDaily(sub.lastResetDate)) {
      sub = await prisma.subscription.update({
        where: { userId: user.id },
        data: resetCountsData(),
      })
    }

    const amount = body.amount ?? 1

    const quota = getQuotaForPlan(sub.plan, body.key)
    if (typeof quota === 'number') {
      const usageCurrent: Record<UsageKey, number> = {
        regen: sub.regenCount,
        download: sub.downloadCount,
        cl: sub.clCount,
        analysis: sub.analysisCount,
        upload: sub.uploadCount,
      }

      const current = usageCurrent[body.key]
      if (current + amount > quota) {
        return NextResponse.json({ error: 'Quota exceeded' }, { status: 403 })
      }
    }

    const updated = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        regenCount: body.key === 'regen' ? { increment: amount } : undefined,
        downloadCount: body.key === 'download' ? { increment: amount } : undefined,
        clCount: body.key === 'cl' ? { increment: amount } : undefined,
        analysisCount: body.key === 'analysis' ? { increment: amount } : undefined,
        uploadCount: body.key === 'upload' ? { increment: amount } : undefined,
      },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
