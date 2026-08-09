'use client'

import { useEffect } from 'react'
import type { JSX } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const REDIRECT_DELAY_MS = 3000

function AccountPage(): JSX.Element {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/builder/settings')
    }, REDIRECT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [router])

  return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4">
          <div className="max-w-md w-full text-center space-y-6">
              <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Account Settings Moved
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                      Account settings are now part of the dashboard for a better experience.
                  </p>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-6 space-y-4">
                  <p className="text-sm text-teal-700 dark:text-teal-300">
                      Redirecting you to the new location...
                  </p>
                  <Link
                      href="/builder/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                      Go to Settings <ArrowRight className="h-4 w-4" />
                  </Link>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                  You can also access settings from the dashboard navigation menu.
              </p>
          </div>
      </div>
  )
}

export default AccountPage
