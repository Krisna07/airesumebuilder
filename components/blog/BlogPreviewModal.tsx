import React from 'react'
import BlogSectionRenderer from './BlogSectionRenderer'
import type { BlogSection, BlogStatus } from '@/types/blog'

interface Props {
  open: boolean
  title: string
  excerpt: string
  author: string
  authorImageUrl?: string
  coverImageUrl?: string
  sections: BlogSection[]
  onClose: () => void
  onConfirm: (status: BlogStatus) => void
}

export default function BlogPreviewModal({ open, title, excerpt, author, authorImageUrl, coverImageUrl, sections, onClose, onConfirm }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt={title} className="w-full h-48 object-cover" />
        ) : null}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              {authorImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorImageUrl} alt={author} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-sm text-slate-500">by {author}</p>
            </div>
          </div>

          <p className="mt-3 italic text-sm text-slate-600">{excerpt}</p>

          <div className="prose prose-slate dark:prose-invert max-w-none mt-4">
            {sections.map((sec) => (
              <BlogSectionRenderer key={sec.id} section={sec} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm('published')}
              className="px-4 py-2 rounded bg-teal-600 text-white"
            >
              Confirm Publish
            </button>
            <button
              type="button"
              onClick={() => onConfirm('draft')}
              className="px-4 py-2 rounded border"
            >
              Save as Draft
            </button>
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-600">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
