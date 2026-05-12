"use client"
import { usePathname } from "next/navigation"
import ConditionalNavbar from "./ConditionalNavbar"
import Footer from "./Footer"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

/**
 * Conditional Layout Component
 * 
 * Wraps the main content and conditionally shows/hides navbar and footer
 * based on the current route.
 * 
 * Routes without navbar/footer:
 * - /auth/* (authentication pages)
 * - /builder/* (dashboard pages - have their own DashboardNav)
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Check if current route should hide navbar/footer
  const isAuthPage = pathname?.startsWith('/auth')
  const isBuilderPage = pathname?.startsWith('/builder')
  
  // Hide navbar/footer on auth and builder pages
  const hideNavAndFooter = isAuthPage || isBuilderPage

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavAndFooter && <ConditionalNavbar />}
      <main className='w-full flex-1'>
        {children}
      </main>
      {!hideNavAndFooter && <Footer />}
    </div>
  )
}
