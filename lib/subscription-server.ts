import { getServerSession } from 'next-auth'
import { prisma } from './prisma'
import { getQuotaForPlan, resetCountsData, shouldResetForPlan, UsageKey, USAGE_FIELD_MAP } from './subscription'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

class AuthError extends Error {
  status = 401
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

class QuotaError extends Error {
  status = 403
  constructor(message = 'Quota exceeded') {
    super(message)
    this.name = 'QuotaError'
  }
}

export async function requireUserSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    throw new AuthError()
  }
  return { userId: session.user.id, email: session.user.email }
}

export async function getFreshSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) {
    sub = await prisma.subscription.create({ data: { userId, plan: 'FREE', ...resetCountsData() } })
  } else if (shouldResetForPlan(sub.plan as 'FREE' | 'SUPPORTER' | 'ULTIMATE', sub.lastResetDate)) {
    sub = await prisma.subscription.update({ where: { userId }, data: resetCountsData() })
  }
  return sub
}

function ensureWithinQuota(sub: Awaited<ReturnType<typeof getFreshSubscription>>, key: UsageKey, amount: number) {
  const quota = getQuotaForPlan(sub.plan, key)
  if (typeof quota !== 'number') return
  const field = USAGE_FIELD_MAP[key] as keyof typeof sub
  const current = Number(sub[field] ?? 0)
  if (current + amount > quota) {
    throw new QuotaError(`Quota exceeded for ${key}`)
  }
}

export async function assertQuota(userId: string, key: UsageKey, amount = 1) {
  const sub = await getFreshSubscription(userId)
  ensureWithinQuota(sub, key, amount)
  return sub
}

export async function consumeUsage(userId: string, key: UsageKey, amount = 1) {
  const sub = await getFreshSubscription(userId)
  ensureWithinQuota(sub, key, amount)
  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      regenCount: key === 'regen' ? { increment: amount } : undefined,
      downloadCount: key === 'download' ? { increment: amount } : undefined,
      clCount: key === 'cl' ? { increment: amount } : undefined,
      analysisCount: key === 'analysis' ? { increment: amount } : undefined,
      uploadCount: key === 'upload' ? { increment: amount } : undefined,
    },
  })

  // Also track lifetime totals in UsageHistory (best-effort)
  try {
    const totalsFieldMap: Record<UsageKey, keyof { regenTotal: number; downloadTotal: number; clTotal: number; analysisTotal: number; uploadTotal: number }> = {
      regen: 'regenTotal',
      download: 'downloadTotal',
      cl: 'clTotal',
      analysis: 'analysisTotal',
      upload: 'uploadTotal',
    }
    const totalsField = totalsFieldMap[key]
    // Initialize or increment lifetime totals
    await prisma.usageHistory.upsert({
      where: { userId },
      update: { [totalsField]: { increment: amount } },
      create: {
        userId,
        regenTotal: key === 'regen' ? amount : 0,
        downloadTotal: key === 'download' ? amount : 0,
        clTotal: key === 'cl' ? amount : 0,
        analysisTotal: key === 'analysis' ? amount : 0,
        uploadTotal: key === 'upload' ? amount : 0,
      },
    })
  } catch (e) {
    // Swallow errors to avoid breaking primary flow if UsageHistory schema isn't ready
    console.warn('UsageHistory update failed (non-blocking):', e)
  }

  return updated
}

export function mapSubscriptionError(err: unknown) {
  if (err instanceof AuthError) return { status: err.status, message: err.message }
  if (err instanceof QuotaError) return { status: err.status, message: err.message }
  return { status: 500, message: 'Unexpected error' }
}

export type SubscriptionGuardError = ReturnType<typeof mapSubscriptionError>
