'use client'

import { JSX, useMemo } from 'react'
import { useAuth } from '@/context/authContext'
import { getQuotaForPlan, UsageKey } from '@/lib/subscriptionConfig'
import type { Subscription } from '@/types/subscription'
import { Crown, Lock, Sparkles, Download, Mail, Brain, Upload, ShieldCheck, TrendingUp } from 'lucide-react'

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

const USAGE_TOTAL_FIELDS: Record<UsageKey, string> = {
  regen: 'regenTotal',
  download: 'downloadTotal',
  cl: 'clTotal',
  analysis: 'analysisTotal',
  upload: 'uploadTotal',
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
      const percentage = typeof quota === 'number' && quota > 0 ? (used / quota) * 100 : 0
      const totalField = USAGE_TOTAL_FIELDS[key]
      const lifetimeTotal = sub.usageHistory ? Number((sub.usageHistory as any)[totalField] || 0) : 0
      return { key, quota, used, remaining, percentage, lifetimeTotal }
    })
  }, [sub])

  if (!sub) return null

  return (
    <div className={`relative overflow-hidden p-6 border-2 select-none border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md">
              {PLAN_ICON[sub.plan]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Usage Overview</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{sub.plan} Plan</p>
            </div>
          </div>
        </div>

        {/* Current Period Usage */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Period</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          {rows.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {USAGE_ICONS[row.key]}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{USAGE_LABELS[row.key]}</span>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {row.quota === null ? (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full text-[10px] font-semibold">
                      UNLIMITED
                    </span>
                  ) : (
                    `${row.used}/${row.quota}`
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {row.quota !== null && (
                <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(row.percentage, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lifetime Totals */}
        {sub.usageHistory && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lifetime Totals</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rows.map((row) => (
                <div key={`total-${row.key}`} className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="p-1.5 bg-white dark:bg-slate-700 rounded">
                    {USAGE_ICONS[row.key]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{USAGE_LABELS[row.key]}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{row.lifetimeTotal.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
