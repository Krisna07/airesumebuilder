"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname() || ''

  // Don't show footer on the builder pages (workspace/editor)
  if (pathname.startsWith('/builder')) return null

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-transparent">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-600 dark:text-slate-300">© {new Date().getFullYear()} AI Resume Craft. All rights reserved.</div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/blogs" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Blog</Link>
          <Link href="/pricing" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Pricing</Link>
          <Link href="/privacy" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Privacy</Link>
          <Link href="/terms" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Terms</Link>
          <Link href="/message-to-supporters" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Supporters</Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}
