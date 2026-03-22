'use client'
import BlogEditor from '@/components/blog/BlogEditor'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'

import { useEffect } from 'react'

export default function AddBlogsCmsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/blogs')
    }
  }, [user, router])

  if (user && !user.isAdmin) {
    return null
  }

  return (
    !loading && user?.isAdmin && <section className="py-8 px-3 sm:px-6 space-y-4">
      <div className="w-full max-w-4xl mx-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-4 sm:p-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">Blog CMS</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Create and publish blog posts with section-based content and drag-drop image placement.
        </p>
      </div>
      <BlogEditor />
    </section>
  )

}
