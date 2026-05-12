import type { ReactNode } from "react"

interface PreviewLayoutProps {
  children: ReactNode
}

/**
 * Preview Page Layout
 * 
 * Minimal layout for the preview page that:
 * - Inherits DashboardNav from parent layout
 * - Uses LiquidNav for mobile bottom navigation (defined in page.tsx)
 * - Provides full-width container for preview content
 */
export default function PreviewLayout({ children }: PreviewLayoutProps) {
  return <>{children}</>
}
