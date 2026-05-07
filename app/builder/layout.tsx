"use client"
import type { ReactNode } from "react"
import DashboardNav from "@/components/DashboardNav"
import DashboardMobileNav from "@/components/DashboardMobileNav"
import { usePathname } from "next/navigation"

interface BuilderLayoutProps {
  children: ReactNode
}

/**
 * Dashboard Layout Component for Builder Pages
 * 
 * Provides a consistent layout structure for dashboard-style interfaces with:
 * - Dashboard-specific navigation (DashboardNav)
 * - Responsive container with max-width constraints
 * - Centered content layout
 * - Support for dark mode
 * - Flexible content area
 * 
 * Design System Specifications:
 * - Max-width: 1200px (wider than content-focused pages for dashboard feel)
 * - Responsive padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
 * - Centered layout with proper spacing
 * 
 * Usage:
 * This layout wraps all pages in the /builder route, providing consistent
 * spacing and container constraints. Individual pages can override or extend
 * these patterns as needed.
 * 
 * Note: This layout uses DashboardNav instead of the global Navbar to provide
 * dashboard-specific navigation links (Dashboard, My Resumes, Account, Pricing)
 * without homepage-specific links (Home, Blogs).
 */
export default function BuilderLayout({ children }: BuilderLayoutProps) {
  const pathname = usePathname()
  const isPreviewPage = pathname?.includes('/preview')

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950">
      {/* Dashboard Navigation - Always show */}
      <DashboardNav />
      
      {/* Dashboard Container */}
      <div className={`mx-auto w-full ${isPreviewPage ? '' : 'max-w-[1200px] lg:px-8 bg-slate-50 dark:bg-slate-900'}`}>
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
