export type Plan = 'FREE' | 'SUPPORTER' | 'ULTIMATE'

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
}

export type IncrementKey = 'regen' | 'download' | 'cl' | 'analysis' | 'upload'
