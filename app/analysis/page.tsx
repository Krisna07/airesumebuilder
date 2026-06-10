'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, UploadCloud } from 'lucide-react'
import JobAnalysisReport from '@/components/Ui/JobAnalysisReport'
import type { AnalysisResult, ResumeData } from '@/types/types'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'

const PRE_LOGIN_KEY = 'pre-login-data-airesumecraft'
const GUEST_DEVICE_ID_KEY = 'analysis-guest-device-id'
const GUEST_ANALYSIS_LOCK_KEY = 'analysis-guest-locked'
const GUEST_ANALYSIS_RECORD_KEY = 'analysis-guest-first-run'

type PreLoginData = {
  resumeData: ResumeData
  analysis: AnalysisResult
  resumeText: string
  sourceFileName: string
  createdAt: string
}

type JobState = {
  id: string
  status: 'queued' | 'extracting' | 'parsing' | 'analyzing' | 'persisting' | 'completed' | 'failed'
  progress: number
  message: string
  error?: string
  result?: {
    resumeData: ResumeData
    analysis: AnalysisResult
    resumeText: string
    sourceFileName?: string
    resumeId?: string
    previewPath?: string
  }
}

function toBase64FromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => {
      reader.abort()
      reject(new Error('Failed to read file'))
    }
    reader.onload = () => {
      const result = reader.result
      if (!result || typeof result !== 'string') {
        reject(new Error('Unexpected file read result'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(file)
  })
}

function getResumeBreakdown(resume: ResumeData | null) {
  if (!resume) return null
  return {
    fullName: resume.profile?.fullname || 'Unknown candidate',
    title: resume.title || 'Untitled Resume',
    experiences: Array.isArray(resume.experiences) ? resume.experiences.length : 0,
    educations: Array.isArray(resume.educations) ? resume.educations.length : 0,
    skillsGroups: Array.isArray(resume.skills) ? resume.skills.length : 0,
    links: Array.isArray(resume.profile?.links) ? resume.profile.links.length : 0,
    customSections: Array.isArray(resume.customSections) ? resume.customSections.length : 0,
  }
}

function getGuestDeviceId() {
  const existing = localStorage.getItem(GUEST_DEVICE_ID_KEY)
  if (existing) return existing

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`

  localStorage.setItem(GUEST_DEVICE_ID_KEY, generated)
  return generated
}

function hasGuestAnalysisLock() {
  return localStorage.getItem(GUEST_ANALYSIS_LOCK_KEY) === '1'
}

function setGuestAnalysisLock() {
  localStorage.setItem(GUEST_ANALYSIS_LOCK_KEY, '1')
}

function hasGuestAnalysisRecord() {
  return Boolean(localStorage.getItem(GUEST_ANALYSIS_RECORD_KEY))
}

function setGuestAnalysisRecord(fileName: string) {
  const payload = {
    fileName,
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(GUEST_ANALYSIS_RECORD_KEY, JSON.stringify(payload))
}

export default function AnalysisPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [selectedFileName, setSelectedFileName] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobState, setJobState] = useState<JobState | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [showLoginOverlay, setShowLoginOverlay] = useState(false)
  const [busy, setBusy] = useState(false)
  const [finishingSignInFlow, setFinishingSignInFlow] = useState(false)

  const isLoadingOverlayVisible = Boolean(jobState && jobState.status !== 'completed' && jobState.status !== 'failed')
  const hasResult = Boolean(analysis && resumeData)
  const breakdown = useMemo(() => getResumeBreakdown(resumeData), [resumeData])
  const hasProcessedPreLoginRef = useRef(false)

  const startProcess = useCallback(
    async (file: File) => {
      if (!user && (hasGuestAnalysisLock() || hasGuestAnalysisRecord())) {
        showToast('Guest analysis already used on this device. Sign in to run another analysis.', 'error', 3800)
        setShowLoginOverlay(true)
        return
      }

      setBusy(true)
      setSelectedFileName(file.name)
      setAnalysis(null)
      setResumeData(null)
      setResumeText('')

      try {
        const fileBase64 = await toBase64FromFile(file)
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (!user) {
          headers['x-guest-device-id'] = getGuestDeviceId()
        }

        const response = await fetch('/api/analysis/process/start', {
          method: 'POST',
          headers,
          body: JSON.stringify({ fileBase64, fileName: file.name }),
        })

        const body = await response.json()
        if (!response.ok) {
          throw new Error(body?.error || 'Failed to start processing')
        }

        setJobId(body.data.jobId)
        setJobState({
          id: body.data.jobId,
          status: 'queued',
          progress: 1,
          message: 'Queued',
        })
      } catch (error) {
        console.error(error)
        showToast((error as Error).message || 'Failed to process resume', 'error', 3200)
      } finally {
        setBusy(false)
      }
    },
    [showToast, user],
  )

  useEffect(() => {
    if (!jobId) return

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/process/status?jobId=${encodeURIComponent(jobId)}`)
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.error || 'Failed to fetch progress')
        }

        const state = body.data as JobState
        setJobState(state)

        if (state.status === 'completed') {
          if (state.result) {
            setResumeData(state.result.resumeData)
            setAnalysis(state.result.analysis)
            setResumeText(state.result.resumeText)
            if (!user) {
              setGuestAnalysisLock()
              setGuestAnalysisRecord(state.result.sourceFileName || selectedFileName || 'resume.pdf')
            }
          }
          window.clearInterval(timer)
          showToast('ATS analysis complete', 'success', 2200)
        }

        if (state.status === 'failed') {
          window.clearInterval(timer)
          showToast(state.error || 'Analysis failed', 'error', 3200)
        }
      } catch (error) {
        console.error(error)
      }
    }, 900)

    return () => window.clearInterval(timer)
  }, [jobId, showToast, user])

  const cacheAndRedirectToLogin = useCallback(() => {
    if (!resumeData || !analysis) return
    const payload: PreLoginData = {
      resumeData,
      analysis,
      resumeText,
      sourceFileName: selectedFileName,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(PRE_LOGIN_KEY, JSON.stringify(payload))
    window.location.href = '/auth/signin?next=/analysis'
  }, [analysis, resumeData, resumeText, selectedFileName])

  const completeAfterLogin = useCallback(async () => {
    if (!user || hasProcessedPreLoginRef.current) return

    const raw = localStorage.getItem(PRE_LOGIN_KEY)
    if (!raw) return

    hasProcessedPreLoginRef.current = true
    setFinishingSignInFlow(true)

    try {
      const payload = JSON.parse(raw) as PreLoginData
      const response = await fetch('/api/analysis/complete-on-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Failed to finalize resume after sign in')
      }

      localStorage.removeItem(PRE_LOGIN_KEY)
      router.push(body.data.previewPath || `/builder/resumes/${body.data.resumeId}/preview`)
    } catch (error) {
      hasProcessedPreLoginRef.current = false
      console.error(error)
      showToast((error as Error).message || 'Failed to complete post-login flow', 'error', 3200)
    } finally {
      setFinishingSignInFlow(false)
    }
  }, [router, showToast, user])

  useEffect(() => {
    void completeAfterLogin()
  }, [completeAfterLogin])

  const optimizeAction = useCallback(() => {
    const previewPath = jobState?.result?.previewPath

    if (user && previewPath) {
      router.push(previewPath)
      return
    }

    if (user && !previewPath && hasResult) {
      // Logged-in user but this run started while logged out/session missing.
      const payload: PreLoginData = {
        resumeData: resumeData as ResumeData,
        analysis: analysis as AnalysisResult,
        resumeText,
        sourceFileName: selectedFileName,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(PRE_LOGIN_KEY, JSON.stringify(payload))
      void completeAfterLogin()
      return
    }

    setShowLoginOverlay(true)
  }, [analysis, completeAfterLogin, hasResult, jobState?.result?.previewPath, resumeData, resumeText, router, selectedFileName, user])

  return (
    <main className="min-h-screen w-full px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            ATS Analysis powered by AI
          </div>

          <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Upload Your Resume for Instant ATS Analysis
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            We extract your resume, parse it, and analyze ATS fit in the backend. You see real-time progress and a detailed result overlay.
          </p>

          <div className="mt-8">
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium cursor-pointer transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {busy ? 'Preparing upload...' : 'Upload Resume PDF'}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={busy || isLoadingOverlayVisible || finishingSignInFlow}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void startProcess(file)
                }}
              />
            </label>
          </div>

          {selectedFileName ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Selected file: {selectedFileName}</p>
          ) : null}
        </section>
      </div>

      {isLoadingOverlayVisible ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-7 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-2 border-teal-300/50" />
                <div className="absolute inset-0 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Processing your resume</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{jobState?.message || 'Starting...'}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.max(1, Math.min(100, jobState?.progress || 0))}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                {Math.max(1, Math.min(100, Math.round(jobState?.progress || 0)))}%
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:120ms]" />
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      ) : null}

      {hasResult ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-white/25 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Your ATS Analysis Result</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Review your resume breakdown and continue to optimization.</p>
              </div>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                onClick={() => {
                  setAnalysis(null)
                  setResumeData(null)
                  setResumeText('')
                  setJobId(null)
                  setJobState(null)
                  setSelectedFileName('')
                }}
              >
                Close
              </button>
            </div>

            {breakdown ? (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Candidate</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.fullName}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Experience</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.experiences}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Education</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.educations}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Skill Groups</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.skillsGroups}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Links</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.links}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-slate-500">Custom Sections</p><p className="font-semibold text-slate-900 dark:text-slate-100">{breakdown.customSections}</p></div>
              </div>
            ) : null}

            <div className="mt-4">
              <JobAnalysisReport
                analysis={{ ...(analysis as AnalysisResult), company: 'ATS Standard' }}
                guestMode={!user}
              />

              {!user ? (
                <div className="mt-3 rounded-xl border border-white/35 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 text-center shadow-xl">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Unlock full AI suggestions</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    You can review the analysis now. Sign in to reveal full AI suggestions and optimization guidance.
                  </p>
                  <div className="mt-3 flex justify-center">
                    <Link
                      href="/auth/signin?next=/analysis"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
                    >
                      Sign in to unlock
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={optimizeAction}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
              >
                {user ? 'Go To Preview To Optimize' : 'Sign In To Optimize Resume'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showLoginOverlay ? (
        <div className="fixed inset-0 z-[60] bg-slate-900/55 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sign in to optimize your resume</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              We will save your analysis as pre-login data and continue directly to preview after sign in.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLoginOverlay(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={cacheAndRedirectToLogin}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              >
                Continue
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Manual sign in link:{' '}
              <Link href="/auth/signin?next=/analysis" className="text-indigo-600 hover:underline">
                Open sign in
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      {finishingSignInFlow ? (
        <div className="fixed bottom-4 right-4 z-[70] rounded-xl bg-slate-900 text-white text-sm px-4 py-2 shadow-lg">
          Finalizing your resume and opening preview...
        </div>
      ) : null}
    </main>
  )
}
