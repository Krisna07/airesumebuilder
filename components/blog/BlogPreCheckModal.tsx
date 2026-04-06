'use client'

import { useState } from 'react'
import type { BlogSection, BlogStatus } from '@/types/blog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Check {
  label: string
  pass: boolean
  warn?: boolean // orange warning, not a hard fail
}

interface ImprovedData {
  title: string
  excerpt: string
  sections: BlogSection[]
  seoKeywords: string[]
}

interface Props {
  open: boolean
  title: string
  excerpt: string
  author: string
  /** Raw HTML from TipTap — used for content checks */
  html: string
  /** Raw sections (for polish API) */
  sections: BlogSection[]
  onImprove: (data: ImprovedData) => void
  onConfirm: (status: BlogStatus) => void
  onClose: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runChecks(title: string, excerpt: string, html: string): Check[] {
  const container =
    typeof document !== 'undefined' ? document.createElement('div') : null
  if (container) container.innerHTML = html

  const paragraphCount = container
    ? container.querySelectorAll('p').length
    : (html.match(/<p/gi) || []).length

  const wordCount = container
    ? (container.textContent || '').trim().split(/\s+/).filter(Boolean).length
    : html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length

  return [
    {
      label: 'Title is present (min 3 chars)',
      pass: title.trim().length >= 3,
    },
    {
      label: 'Excerpt is present (min 10 chars)',
      pass: excerpt.trim().length >= 10,
      warn: excerpt.trim().length > 0 && excerpt.trim().length < 10,
    },
    {
      label: 'At least 2 paragraphs',
      pass: paragraphCount >= 2,
    },
    {
      label: `Word count ≥ 200 (currently ~${wordCount})`,
      pass: wordCount >= 200,
      warn: wordCount >= 50 && wordCount < 200,
    },
  ]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BlogPreCheckModal({
  open,
  title,
  excerpt,
  author,
  html,
  sections,
  onImprove,
  onConfirm,
  onClose,
}: Props) {
  const [improving, setImproving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [improveMsg, setImproveMsg] = useState<string | null>(null)
  const [improveError, setImproveError] = useState<string | null>(null)

  if (!open) return null

  const checks = runChecks(title, excerpt, html)
  const hardFails = checks.filter((c) => !c.pass && !c.warn)
  const canPublish = hardFails.length === 0

  async function handleImprove() {
    setImproving(true)
    setImproveMsg(null)
    setImproveError(null)
    try {
      const res = await fetch('/api/ai/regenerate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, sections }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Improvement failed')

      onImprove({
        title: json.data.title,
        excerpt: json.data.excerpt,
        sections: json.data.sections,
        seoKeywords: json.data.seoKeywords || [],
      })
      setImproveMsg(
        `✅ Improved! SEO keywords added: ${(json.data.seoKeywords || []).join(', ') || 'none'}`
      )
    } catch (err) {
      setImproveError(err instanceof Error ? err.message : 'Improvement failed.')
    } finally {
      setImproving(false)
    }
  }

  async function handleConfirm(status: BlogStatus) {
    setPublishing(true)
    try {
      await onConfirm(status)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Pre-Publish Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              by <span className="font-medium">{author || 'Unknown'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-2.5">
          {checks.map((check) => {
            const icon = check.pass ? '✅' : check.warn ? '⚠️' : '❌'
            const textColor = check.pass
              ? 'text-slate-700 dark:text-slate-300'
              : check.warn
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-red-600 dark:text-red-400'
            return (
              <div key={check.label} className="flex items-start gap-2">
                <span className="text-sm leading-5">{icon}</span>
                <span className={`text-sm ${textColor}`}>{check.label}</span>
              </div>
            )
          })}
        </div>

        {/* Improve feedback */}
        {improveMsg && (
          <div className="mx-6 mb-3 rounded-lg px-3 py-2 bg-green-50 dark:bg-green-900/20 text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            {improveMsg}
          </div>
        )}
        {improveError && (
          <div className="mx-6 mb-3 rounded-lg px-3 py-2 bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            {improveError}
          </div>
        )}

        {!canPublish && (
          <div className="mx-6 mb-3 rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
            Fix the issues above before publishing. You can still save as draft.
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Improve with AI — always available */}
          <button
            type="button"
            onClick={handleImprove}
            disabled={improving || sections.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
          >
            {improving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Improving…
              </>
            ) : (
              '✨ Improve with AI'
            )}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleConfirm('published')}
              disabled={!canPublish || publishing}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              {publishing ? '…' : '🚀 Publish'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirm('draft')}
              disabled={publishing}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              💾 Save Draft
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
