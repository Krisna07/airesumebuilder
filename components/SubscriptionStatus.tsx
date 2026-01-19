'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { getQuotaForPlan, UsageKey } from '@/lib/subscription'

type Subscription = {
  plan: 'FREE' | 'SUPPORTER' | 'ULTIMATE'
  regenCount: number
  downloadCount: number
  clCount: number
  analysisCount: number
  uploadCount: number
}

const USAGE_LABELS: Record<UsageKey, string> = {
  regen: 'Regenerations',
  download: 'Downloads',
  cl: 'Cover Letters',
  analysis: 'Analyses',
  upload: 'Uploads',
}

const USAGE_FIELDS: Record<UsageKey, keyof Subscription> = {
  regen: 'regenCount',
  download: 'downloadCount',
  cl: 'clCount',
  analysis: 'analysisCount',
  upload: 'uploadCount',
}

export default function SubscriptionStatus() {
  const { getSubscription } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)

  useEffect(() => {
    let mounted = true
    getSubscription().then(data => {
      if (mounted && data) setSub(data)
    })
    return () => {
      mounted = false
    }
  }, [getSubscription])

  const rows = useMemo(() => {
    if (!sub) return []
    const keys: UsageKey[] = ['regen', 'download', 'cl', 'analysis', 'upload']
    return keys.map(key => {
      const quota = getQuotaForPlan(sub.plan, key)
      const used = Number(sub[USAGE_FIELDS[key]])
      const remaining = typeof quota === 'number' ? Math.max(0, quota - used) : null
      return { key, quota, used, remaining }
    })
  }, [sub])

  if (!sub) return null

  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Plan</p>
        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{sub.plan}</span>
      </div>
      <div className="mt-2 space-y-1">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>{USAGE_LABELS[row.key]}</span>
            <span>
              {row.quota === null ? 'Unlimited' : `${row.remaining}/${row.quota}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
