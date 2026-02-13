export type UsageKey = 'regen' | 'download' | 'cl' | 'analysis' | 'upload'
export type Plan = 'FREE' | 'SUPPORTER' | 'ULTIMATE'

export const PLAN_QUOTAS: Record<Plan, Partial<Record<UsageKey, number | null>> | null> = {
  FREE: { regen: 20, download: null, cl: 20, analysis: 20, upload: null },
  // Supporter: unlimited usage
  SUPPORTER: null,
  // Ultimate: unlimited usage
  ULTIMATE: null,
}

export const USAGE_FIELD_MAP: Record<UsageKey, string> = {
  regen: 'regenCount',
  download: 'downloadCount',
  cl: 'clCount',
  analysis: 'analysisCount',
  upload: 'uploadCount',
}

export function isSameUtcDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
}

export function shouldResetDaily(lastResetDate: Date, now = new Date()) {
  return !isSameUtcDay(lastResetDate, now)
}

// Helper to determine if we should reset counters based on plan
export function shouldResetForPlan(plan: Plan, lastResetDate: Date, now = new Date()) {
  if (plan === 'FREE') return shouldResetDaily(lastResetDate, now)
  return false
}

export function getQuotaForPlan(plan: Plan, key: UsageKey): number | null {
  const quotas = PLAN_QUOTAS[plan]
  if (!quotas) return null
  return typeof quotas[key] === 'number' ? quotas[key]! : null
}

export function resetCountsData(now = new Date()) {
  return {
    regenCount: 0,
    downloadCount: 0,
    clCount: 0,
    analysisCount: 0,
    uploadCount: 0,
    lastResetDate: now,
  }
}
