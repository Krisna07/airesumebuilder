import type { ReactNode } from "react"
import clsx from "clsx"

interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  sidebar?: ReactNode
  actionBar?: ReactNode
  maxWidth?: "default" | "wide" | "narrow"
  className?: string
}

/**
 * Reusable Dashboard Layout Component
 * 
 * A flexible dashboard layout with optional slots for header, sidebar, and action bar.
 * Follows the design system specifications for dashboard patterns.
 * 
 * Features:
 * - Optional header slot for titles, breadcrumbs, and actions
 * - Optional sidebar slot for navigation and filters (collapsible on mobile)
 * - Optional action bar slot with fixed bottom positioning
 * - Responsive container with configurable max-width
 * - Dark mode support
 * - Proper spacing and layout management
 * 
 * Design System Specifications:
 * - Container max-width: 850px (narrow), 1200px (default), 1400px (wide)
 * - Responsive padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
 * - Sidebar min-width: 240px on desktop
 * - Action bar: Fixed bottom with backdrop blur
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   header={<h1>Dashboard Title</h1>}
 *   sidebar={<nav>Navigation</nav>}
 *   actionBar={<Button>Save</Button>}
 * >
 *   <div>Main content</div>
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  header,
  sidebar,
  actionBar,
  maxWidth = "default",
  className,
}: DashboardLayoutProps) {
  const maxWidthClasses = {
    narrow: "max-w-[850px]",
    default: "max-w-[1200px]",
    wide: "max-w-[1400px]",
  }

  const hasSidebar = !!sidebar
  const hasActionBar = !!actionBar

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950">
      {/* Dashboard Container */}
      <div
        className={clsx(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {/* Optional Header */}
        {header && (
          <header className="w-full border-b border-gray-200/50 py-4 dark:border-slate-700">
            {header}
          </header>
        )}

        {/* Main Layout with Optional Sidebar */}
        <div className={clsx("flex w-full gap-6", hasSidebar && "lg:gap-8")}>
          {/* Optional Sidebar */}
          {sidebar && (
            <aside
              className={clsx(
                "w-full shrink-0 lg:w-[240px]",
                "border-b border-gray-200/50 py-4 dark:border-slate-700 lg:border-b-0 lg:border-r lg:py-6",
              )}
            >
              {sidebar}
            </aside>
          )}

          {/* Main Content Area */}
          <main
            className={clsx(
              "w-full flex-1 py-4 lg:py-6",
              hasActionBar && "pb-24", // Add bottom padding when action bar is present
            )}
          >
            {children}
          </main>
        </div>

        {/* Optional Action Bar */}
        {actionBar && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div
              className={clsx(
                "mx-auto flex w-full items-center justify-center gap-2",
                maxWidthClasses[maxWidth],
              )}
            >
              {actionBar}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Dashboard Header Component
 * 
 * Pre-styled header component for dashboard pages with title and optional actions.
 * 
 * @example
 * ```tsx
 * <DashboardHeader
 *   title="All Resumes"
 *   metadata="12 in total"
 *   actions={<Button>Add New</Button>}
 * />
 * ```
 */
interface DashboardHeaderProps {
  title: string
  metadata?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
}

export function DashboardHeader({ title, metadata, actions, breadcrumbs }: DashboardHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs && <div className="text-sm text-gray-600 dark:text-gray-400">{breadcrumbs}</div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
          {title}
          {metadata && <span className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">{metadata}</span>}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/**
 * Dashboard Empty State Component
 * 
 * Consistent empty state pattern for dashboards with icon, message, and CTA.
 * 
 * @example
 * ```tsx
 * <DashboardEmptyState
 *   icon={<Rocket className="h-12 w-12" />}
 *   title="Let's get started"
 *   description="Create your first resume to begin."
 *   action={<Button>Add New</Button>}
 * />
 * ```
 */
interface DashboardEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function DashboardEmptyState({ icon, title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      {icon && <div className="text-teal-500">{icon}</div>}
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * Dashboard Card Grid Component
 * 
 * Responsive grid layout for dashboard cards following design system patterns.
 * 
 * @example
 * ```tsx
 * <DashboardCardGrid>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </DashboardCardGrid>
 * ```
 */
interface DashboardCardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function DashboardCardGrid({ children, columns = 3, className }: DashboardCardGridProps) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }

  return (
    <div
      className={clsx(
        "grid w-full gap-4",
        gridClasses[columns],
        className,
      )}
    >
      {children}
    </div>
  )
}
