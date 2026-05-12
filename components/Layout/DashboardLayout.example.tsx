/**
 * Dashboard Layout Usage Examples
 * 
 * This file demonstrates various usage patterns for the DashboardLayout components.
 * These examples can be used as reference when building new dashboard pages.
 */

import { DashboardLayout, DashboardHeader, DashboardEmptyState, DashboardCardGrid } from "./DashboardLayout"
import Button from "@/components/Ui/Button"
import { Rocket, Plus, File, Search } from "lucide-react"

// ============================================================================
// Example 1: Basic Dashboard with Header
// ============================================================================

export function BasicDashboardExample() {
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="My Dashboard"
          metadata="24 items"
        />
      }
    >
      <div className="space-y-4">
        <p>Main content goes here</p>
      </div>
    </DashboardLayout>
  )
}

// ============================================================================
// Example 2: Dashboard with Action Bar (like /builder page)
// ============================================================================

export function DashboardWithActionBarExample() {
  return (
    <DashboardLayout
      maxWidth="narrow"
      actionBar={
        <div className="flex items-center gap-2">
          <Button variant="primary" size="medium">
            <Plus className="h-4 w-4" /> Add New
          </Button>
          <Button variant="secondary" size="medium">
            <File className="h-4 w-4" /> Upload PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <h3 className="border-b border-gray-300 pb-2 text-2xl font-medium dark:border-slate-600">
          All Items
        </h3>
        <DashboardCardGrid columns={3} children={undefined}>
          {/* Card items */}
        </DashboardCardGrid>
      </div>
    </DashboardLayout>
  )
}

// ============================================================================
// Example 3: Dashboard with Sidebar
// ============================================================================

export function DashboardWithSidebarExample() {
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="Settings"
          breadcrumbs={
            <nav className="flex items-center gap-2 text-sm">
              <a href="/" className="text-teal-600 hover:underline">Home</a>
              <span>/</span>
              <span>Settings</span>
            </nav>
          }
        />
      }
      sidebar={
        <nav className="space-y-2">
          <a href="#profile" className="block rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800">
            Profile
          </a>
          <a href="#security" className="block rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800">
            Security
          </a>
          <a href="#billing" className="block rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800">
            Billing
          </a>
        </nav>
      }
    >
      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Profile Settings</h2>
          {/* Settings content */}
        </section>
      </div>
    </DashboardLayout>
  )
}

// ============================================================================
// Example 4: Empty State Dashboard
// ============================================================================

export function EmptyStateDashboardExample() {
  const hasItems = false // Simulate empty state

  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="My Projects"
          metadata={hasItems ? "12 projects" : undefined}
          actions={
            hasItems ? (
              <Button variant="primary" size="small">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            ) : undefined
          }
        />
      }
      actionBar={
        <Button variant="primary" size="medium">
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      }
    >
      {hasItems ? (
        <DashboardCardGrid columns={3} children={undefined}>
          {/* Project cards */}
        </DashboardCardGrid>
      ) : (
        <DashboardEmptyState
          icon={<Rocket className="h-12 w-12 animate-pulse" />}
          title="Let's get started"
          description="Create your first project to begin. You can always add, edit, or delete projects later."
          action={
            <Button variant="primary" size="large">
              <Plus className="h-5 w-5" /> Create First Project
            </Button>
          }
        />
      )}
    </DashboardLayout>
  )
}

// ============================================================================
// Example 5: Search Results Dashboard
// ============================================================================

export function SearchResultsDashboardExample() {
  const searchQuery = "design"
  const results = [] // Simulate no results

  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="Search Results"
          metadata={results.length > 0 ? `${results.length} results` : undefined}
        />
      }
    >
      {results.length > 0 ? (
        <DashboardCardGrid columns={3} children={undefined}>
          {/* Result cards */}
        </DashboardCardGrid>
      ) : (
        <DashboardEmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description={`We couldn't find any results for "${searchQuery}". Try adjusting your search terms.`}
          action={
            <Button variant="secondary" size="medium">
              Clear Search
            </Button>
          }
        />
      )}
    </DashboardLayout>
  )
}

// ============================================================================
// Example 6: Full-Featured Dashboard
// ============================================================================

export function FullFeaturedDashboardExample() {
  return (
    <DashboardLayout
      maxWidth="wide"
      header={
        <DashboardHeader
          title="Analytics Dashboard"
          metadata="Last updated 5 minutes ago"
          breadcrumbs={
            <nav className="flex items-center gap-2 text-sm">
              <a href="/" className="text-teal-600 hover:underline">Home</a>
              <span>/</span>
              <a href="/dashboards" className="text-teal-600 hover:underline">Dashboards</a>
              <span>/</span>
              <span>Analytics</span>
            </nav>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="small">
                Export
              </Button>
              <Button variant="primary" size="small">
                Refresh
              </Button>
            </div>
          }
        />
      }
      sidebar={
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Archived</span>
              </label>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Date Range</h3>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>
      }
      actionBar={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="medium">
            Cancel
          </Button>
          <Button variant="primary" size="medium">
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metrics cards */}
        <DashboardCardGrid columns={4}>
          <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="text-3xl font-bold">1,234</div>
          </div>
          <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
            <div className="text-3xl font-bold">567</div>
          </div>
          <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
            <div className="text-3xl font-bold">12.5%</div>
          </div>
          <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
            <div className="text-3xl font-bold">$45.2K</div>
          </div>
        </DashboardCardGrid>

        {/* Main content */}
        <div className="rounded-lg border border-gray-200/50 p-6 dark:border-slate-700">
          <h2 className="mb-4 text-xl font-semibold">Activity Chart</h2>
          {/* Chart component */}
        </div>
      </div>
    </DashboardLayout>
  )
}

// ============================================================================
// Example 7: Responsive Card Grid Variations
// ============================================================================

export function CardGridVariationsExample() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 2-column grid */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">2-Column Grid</h2>
          <DashboardCardGrid columns={2}>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 1</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 2</div>
          </DashboardCardGrid>
        </section>

        {/* 3-column grid (default) */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">3-Column Grid</h2>
          <DashboardCardGrid columns={3}>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 1</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 2</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 3</div>
          </DashboardCardGrid>
        </section>

        {/* 4-column grid */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">4-Column Grid</h2>
          <DashboardCardGrid columns={4}>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 1</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 2</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 3</div>
            <div className="rounded-lg border border-gray-200/50 p-4 dark:border-slate-700">Card 4</div>
          </DashboardCardGrid>
        </section>
      </div>
    </DashboardLayout>
  )
}
