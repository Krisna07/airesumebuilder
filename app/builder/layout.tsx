"use client"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardNav from "@/components/DashboardNav"
import DashboardMobileNav from "@/components/DashboardMobileNav"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/authContext"

interface BuilderLayoutProps {
  children: ReactNode
}

export default function BuilderLayout({ children }: BuilderLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const isPreviewPage = pathname?.includes('/preview')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950">
      {/* Dashboard Navigation - Always show */}
      <DashboardNav />
      
      {/* Dashboard Container */}
      <div className={`mx-auto w-full ${isPreviewPage ? '' : 'max-w-[1200px] lg:px-8 '}`}>
        {/* Main Content Area */}
        <main className={`w-full ${isPreviewPage ? '' : 'pb-20 sm:pb-0'}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Hidden on preview pages (they have their own LiquidNav) */}
      {!isPreviewPage && <DashboardMobileNav />}
    </div>
  )
}
