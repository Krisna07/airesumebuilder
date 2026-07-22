import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQuotaForPlan, resetCountsData, shouldResetDaily, UsageKey } from '@/lib/subscription'
import { requireUserSession, mapSubscriptionError } from '@/lib/subscription-server'

type Payload = { key: UsageKey; amount?: number }

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

export async function POST(req: Request) {
  let resolved
  try {
    resolved = await requireUserSession()
  } catch (err) {
    const mapped = mapSubscriptionError(err)
    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
  }
  const body: Payload = await req.json()
  if (!body?.key) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  if (!checkRateLimit(resolved.userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let sub = await prisma.subscription.findUnique({ where: { userId: resolved.userId } })
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  // Auto-reset daily quotas when day changes
  if (shouldResetDaily(sub.lastResetDate)) {
    sub = await prisma.subscription.update({
      where: { userId: resolved.userId },
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

  // For ULTIMATE and FREE (FREE has no enforced quota here), just increment
  const updated = await prisma.subscription.update({
    where: { userId: resolved.userId },
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
