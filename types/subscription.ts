export type Plan = 'FREE' | 'SUPPORTER' | 'ULTIMATE'

export interface UsageHistory {
  id: string
  userId: string
  regenTotal: number
  downloadTotal: number
  clTotal: number
  analysisTotal: number
  uploadTotal: number
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: Plan
  regenCount: number
  downloadCount: number
  clCount: number
  analysisCount: number
  uploadCount: number
  lastResetDate: string // ISO date
  updatedAt: string // ISO date
  usageHistory?: UsageHistory // Optional lifetime totals
}

export type IncrementKey = 'regen' | 'download' | 'cl' | 'analysis' | 'upload'
