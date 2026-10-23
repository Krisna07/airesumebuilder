"use client"

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, Loader2 } from 'lucide-react';
import dummyResume from '@/data/dummyResume.json';
import ResumePreview from './ResumePreview';
import Templates from './templates';
import { useCreateFromTemplate } from '@/hooks/useCreateFromTemplate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResume: any = dummyResume

const ALL = 'All'

export default function TemplateGallery() {
  const [activeTag, setActiveTag] = useState(ALL)
  const { creatingTemplate, createFromTemplate } = useCreateFromTemplate()

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    Templates.forEach((t) => t.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
    return [ALL, ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)]
  }, [])

  const visible = activeTag === ALL ? Templates : Templates.filter((t) => t.tags?.includes(activeTag))

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-1" role="group" aria-label="Filter templates">
          {tags.map((tag) => {
            const active = tag === activeTag
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveTag(tag)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-teal-400 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-teal-300'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {visible.length} template{visible.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Grid */}
      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => {
          const isCreating = creatingTemplate === template.id
          return (
            <li key={template.id} className="group min-w-0">
              <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-teal-900/10 group-hover:ring-teal-400 dark:ring-slate-700 dark:group-hover:shadow-black/40">
                <div className={`h-1 w-full bg-gradient-to-r ${template.accent}`} />
                <div className="relative aspect-[3/4] overflow-hidden p-2">
                  <ResumePreview
                    resumeData={mockResume}
                    template={template.id}
                    deferUntilVisible
                    className="pointer-events-none h-full w-full rounded p-0! aspect-3/4!"
                  />
                  {/* Fade the bottom of the page so long templates don't look cut off */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />

                  {/* Actions: always visible on touch, revealed on hover for pointer devices */}
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3 transition-all duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => createFromTemplate(template.id)}
                      disabled={creatingTemplate !== null}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition-colors hover:bg-teal-500 disabled:opacity-70"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating
                        </>
                      ) : (
                        <>
                          Use template <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <Link
                      href={`/templates/${template.id}`}
                      aria-label={`View ${template.name} template details`}
                      className="inline-flex items-center justify-center rounded-xl bg-white/95 px-3 text-slate-700 shadow-lg ring-1 ring-slate-200 transition-colors hover:text-teal-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 px-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    <Link href={`/templates/${template.id}`} className="hover:text-teal-600 dark:hover:text-teal-300">
                      {template.name}
                    </Link>
                  </h2>
                  {template.tags?.includes('ATS-Friendly') && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                      ATS-ready
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{template.description}</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {template.tags?.filter((tag) => tag !== 'ATS-Friendly').map((tag) => (
                    <li key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
