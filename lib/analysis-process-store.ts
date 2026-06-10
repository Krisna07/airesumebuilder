import type { AnalysisResult, ResumeData } from '@/types/types'

export type AnalysisJobStatus = 'queued' | 'extracting' | 'parsing' | 'analyzing' | 'persisting' | 'completed' | 'failed'

export type AnalysisJobResult = {
  resumeData: ResumeData
  analysis: AnalysisResult
  resumeText: string
  sourceFileName?: string
  resumeId?: string
  previewPath?: string
}

export type AnalysisJobState = {
  id: string
  status: AnalysisJobStatus
  progress: number
  message: string
  createdAt: number
  updatedAt: number
  error?: string
  result?: AnalysisJobResult
}

type AnalysisStore = Map<string, AnalysisJobState>

declare global {
  // eslint-disable-next-line no-var
  var __analysisProcessStore: AnalysisStore | undefined
}

function getStore(): AnalysisStore {
  if (!global.__analysisProcessStore) {
    global.__analysisProcessStore = new Map<string, AnalysisJobState>()
  }
  return global.__analysisProcessStore
}

export function createAnalysisJob(id: string): AnalysisJobState {
  const now = Date.now()
  const job: AnalysisJobState = {
    id,
    status: 'queued',
    progress: 0,
    message: 'Queued',
    createdAt: now,
    updatedAt: now,
  }
  getStore().set(id, job)
  return job
}

export function getAnalysisJob(id: string): AnalysisJobState | null {
  return getStore().get(id) || null
}

export function updateAnalysisJob(id: string, patch: Partial<AnalysisJobState>): AnalysisJobState | null {
  const existing = getStore().get(id)
  if (!existing) return null
  const next: AnalysisJobState = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  }
  getStore().set(id, next)
  return next
}
