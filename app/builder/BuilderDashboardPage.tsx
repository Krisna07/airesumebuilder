"use client"
import Button from "@/components/Ui/Button"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, File, TrendingUp, FileText, FilePlus, Activity, Calendar, ArrowUp, Sparkles, Loader2, FolderOpen } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { ResumeService } from "@/services/resumeServices"
import GuestUser from "@/components/BuilderComponents/GuestUser"
import { PreviewContainer } from "@/components/BuilderComponents/PreviewContainer"
import LoadingResumeState from "@/components/BuilderComponents/LoadingResumeState"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import SubscriptionStatus from "@/components/SubscriptionStatus"
import { useRouter } from "next/navigation"
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "@/lib/analytics/events"

function getPreviewLimitByWidth(width: number) {
  if (width >= 1280) return 4 // large (xl)
  if (width >= 768) return 3 // medium (md)
  return 2 // small
}

/**
 * Dashboard Overview Page
 * 
 * Main dashboard page showing:
 * - Welcome header with user name
 * - Quick stats cards (total resumes, active, drafts, usage)
 * - Usage details section with subscription status
 * - Recent resumes preview (last 3-4)
 * - Quick actions (create new, upload PDF, view all)
 */
const DashboardPage = () => {
  const { user, loading: authLoading, subscription } = useAuth()
  const [creating, setCreating] = useState(false)
  const [previewLimit, setPreviewLimit] = useState(4)
  const router = useRouter()

  useEffect(() => {
    const syncPreviewLimit = () => {
      setPreviewLimit(getPreviewLimitByWidth(window.innerWidth))
    }

    syncPreviewLimit()
    window.addEventListener('resize', syncPreviewLimit)
    return () => window.removeEventListener('resize', syncPreviewLimit)
  }, [])

  const {
    data: resumes,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["resumeData", user?.id],
    queryFn: () => ResumeService.getAll(user!.id),
    enabled: !!user,
    staleTime: 30000,
  })

  useMemo(() => {
    if (isError && error) {
      toast.error(error.message || "Failed to load resumes")
    }
  }, [isError, error])

  const hasMinimumData = useCallback((r: { profile?: { fullname?: string; email?: string } }) => {
    return !!(r.profile?.fullname && r.profile?.email)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    if (!resumes) return { total: 0, active: 0, drafts: 0 }

    const total = resumes.length
    const active = resumes.filter(r => r.profile?.fullname && r.profile?.email).length
    const drafts = total - active

    return { total, active, drafts }
  }, [resumes])

  // Get recent resumes preview (limited)
  const recentResumes = useMemo(() => {
    if (!resumes) return []
    return resumes.slice(0, previewLimit)
  }, [resumes, previewLimit])

  const allDraftResumes = useMemo(() => {
    if (!resumes) return []
    return resumes.filter((resume) => !hasMinimumData(resume))
  }, [resumes, hasMinimumData])

  const draftResumes = useMemo(() => {
    return allDraftResumes.slice(0, previewLimit)
  }, [allDraftResumes, previewLimit])

  // Get current date and greeting
  const { currentDate, greeting } = useMemo(() => {
    const now = new Date()
    const hour = now.getHours()
    let greetingText = 'Good morning'

    if (hour >= 12 && hour < 17) {
      greetingText = 'Good afternoon'
    } else if (hour >= 17) {
      greetingText = 'Good evening'
    }

    const dateText = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return { currentDate: dateText, greeting: greetingText }
  }, [])

  const handleResumeDeleted = useCallback(async () => {
    await refetch()
  }, [refetch])

  const handleCreateResume = useCallback(async () => {
    if (creating || !user) return

    setCreating(true)
    try {
      const response = await ResumeService.create(user.id)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || response.statusText)
        return
      }

      trackAnalyticsEvent(ANALYTICS_EVENTS.BUILDER_START, {
        source: 'builder_dashboard',
      })

      toast.success("Resume created successfully")
      router.push(`/builder/resumes/${data.data.id}`)
    } catch (err) {
      console.error("Error creating resume:", err)
      toast.error("Error creating resume")
    } finally {
      setCreating(false)
    }
  }, [creating, user, router])

  // Loading state
  if (authLoading || (user && isPending)) {
    return <LoadingResumeState />
  }

  // Guest user state
  if (!user) {
    return (
      <section className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center anim-fade-in-soft">
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create Your First AI-Ready Resume
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
            <Link href={'/auth/signin'} className="text-blue-500 underline">Sign in</Link> to save, analyze and optimize your resumes with automated job description matching.
          </p>
        </div>
        <GuestUser />
      </section>
    )
  }

  return (
    <div className="w-full py-6 space-y-8 px-4">
      {/* Welcome Header with Gradient Background */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 dark:from-teal-600 dark:via-teal-700 dark:to-emerald-700 p-8 shadow-xl anim-fade-in-soft">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>{greeting}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            Welcome back, {user.name}!
          </h1>
          <div className="flex items-center gap-2 text-white/90">
            <Calendar className="h-4 w-4" />
            <p className="text-sm font-medium">{currentDate}</p>
          </div>
        </div>
      </section>

      {/* Quick Stats Cards with Gradients and Animations */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Resumes - Teal Gradient */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer panel-from-left">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-white/80 font-medium mt-1">Total Resumes</p>
            </div>
          </div>
        </div>

        {/* Active Resumes - Emerald Gradient */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer panel-from-center" style={{ animationDelay: '50ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.active}</p>
              <p className="text-sm text-white/80 font-medium mt-1">Active Resumes</p>
              <p className="text-[11px] text-white/70 mt-0.5">Preview-ready resumes</p>
            </div>
          </div>
        </div>

        {/* Draft Resumes - Amber Gradient */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer panel-from-center" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <FilePlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.drafts}</p>
              <p className="text-sm text-white/80 font-medium mt-1">Draft Resumes</p>
              <p className="text-[11px] text-white/70 mt-0.5">Need name and email to preview</p>
            </div>
          </div>
        </div>

        {/* Current Plan - Blue Gradient */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer panel-from-right">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              {subscription?.plan !== 'FREE' && (
                <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{subscription?.plan || 'FREE'}</p>
              <p className="text-sm text-white/80 font-medium mt-1">Current Plan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Resumes with Enhanced Styling */}
      {recentResumes.length > 0 && (
        <section className="space-y-4 anim-fade-in-soft" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Recent Resumes
              </h2>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {recentResumes.length}{resumes && resumes.length > recentResumes.length ? ` / ${resumes.length}` : ''}
              </span>
            </div>
            <Link
              href="/builder/resumes"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300"
            >
              View all resumes
            </Link>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {recentResumes.map((resume) => (
                <PreviewContainer
                  key={resume.id}
                  resume={resume}
                  onDeleted={handleResumeDeleted}
                  allowDelete={false}
                  appearance="flat"
                  size="compact"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {draftResumes.length > 0 && (
        <section className="space-y-4 anim-fade-in-soft" style={{ animationDelay: '175ms' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-700 to-amber-600 dark:from-amber-300 dark:to-amber-200 bg-clip-text text-transparent">
                Draft Resumes
              </h2>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                {draftResumes.length}{allDraftResumes.length > draftResumes.length ? ` / ${allDraftResumes.length}` : ''}
              </span>
            </div>
            <Link
              href="/builder/resumes"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300"
            >
              View all resumes
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {draftResumes.map((resume) => (
              <PreviewContainer
                key={`draft-${resume.id}`}
                resume={resume}
                onDeleted={handleResumeDeleted}
                allowDelete={true}
                appearance="flat"
                size="compact"
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions with Enhanced Styling */}
      <section className="space-y-4 anim-fade-in-soft" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Quick Actions
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={handleCreateResume} disabled={creating} className="block group w-full">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 border-2 border-teal-200 dark:border-teal-700 rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {/* Animated Icon Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/30 dark:bg-teal-700/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {creating ? (
                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                  ) : (
                    <Plus className="h-7 w-7 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {creating ? 'Creating...' : 'Create New'}
                  </h3>
                  <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">Start from scratch</p>
                </div>
              </div>
            </div>
          </button>

          <Link href="/builder/resumes/build" className="block group">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              {/* Animated Icon Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 dark:bg-blue-700/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <File className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Upload PDF</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Import existing</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/builder/resumes" className="block group">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/30 dark:bg-slate-700/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <FolderOpen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">All Resumes</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Browse everything</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Usage Details Section with Enhanced Styling */}
      <section className="space-y-4 anim-fade-in-soft" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Usage & Subscription
          </h2>
        </div>
        <div className={`grid gap-4 ${subscription && subscription.plan !== 'FREE' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Subscription Status */}
          <SubscriptionStatus className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300" />

          {/* Plan Info (if on paid plan) */}
          {subscription && subscription.plan !== 'FREE' && (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-orange-50 dark:from-amber-900/20 dark:via-amber-800/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-6 space-y-4 shadow-md hover:shadow-xl transition-all duration-300 group">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-200/50 dark:bg-amber-700/50 rounded-full">
                  <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-300 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">Premium Active</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent">
                  {subscription.plan} Plan Active
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  You have unlimited access to all features. Thank you for your support!
                </p>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Last reset: {new Date(subscription.lastResetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
