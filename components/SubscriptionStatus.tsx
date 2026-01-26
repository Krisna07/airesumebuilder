'use client'

import { JSX, useMemo } from 'react'
import { useAuth } from '@/context/authContext'
import { getQuotaForPlan, UsageKey } from '@/lib/subscription'
import type { Subscription } from '@/types/subscription'
import { Crown, Lock, Sparkles, Download, Mail, Brain, Upload, ShieldCheck } from 'lucide-react'

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

const USAGE_ICONS: Record<UsageKey, JSX.Element> = {
  regen: <Sparkles className="h-4 w-4 text-teal-500" aria-hidden />,
  download: <Download className="h-4 w-4 text-blue-500" aria-hidden />,
  cl: <Mail className="h-4 w-4 text-indigo-500" aria-hidden />,
  analysis: <Brain className="h-4 w-4 text-amber-500" aria-hidden />,
  upload: <Upload className="h-4 w-4 text-emerald-500" aria-hidden />,
}

const PLAN_ICON: Record<Subscription['plan'], JSX.Element> = {
  FREE: <Lock className="h-4 w-4 text-slate-500" aria-hidden />,
  SUPPORTER: <Crown className="h-4 w-4 text-amber-500" aria-hidden />,
  ULTIMATE: <ShieldCheck className="h-4 w-4 text-teal-500" aria-hidden />,
}

export default function SubscriptionStatus({ className = '' }: { className?: string }) {
  const { subscription: sub } = useAuth()

  const rows = useMemo(() => {
    if (!sub) return []
    const keys: UsageKey[] = ['regen', 'download', 'cl', 'analysis', 'upload']
    return keys.map((key) => {
      const quota = getQuotaForPlan(sub.plan, key)
      const used = Number(sub[USAGE_FIELDS[key]])
      const remaining = typeof quota === 'number' ? Math.max(0, quota - used) : null
      return { key, quota, used, remaining }
    })
  }, [sub])

  if (!sub) return null

  return (
    <div className={`p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
          {PLAN_ICON[sub.plan]}
          <span>{sub.plan}</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">Daily quota</span>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-2">
              {USAGE_ICONS[row.key]}
              <span>{USAGE_LABELS[row.key]}</span>
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {row.quota === null ? 'Unlimited' : `${row.used}/${row.quota}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
