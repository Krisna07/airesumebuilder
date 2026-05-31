"use client"
import Button from "@/components/Ui/Button"
import Link from "next/link"
import { useState, useCallback, useMemo } from "react"
import { File, Plus, Rocket, Loader2 } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { ResumeService } from "@/services/resumeServices"
import { useRouter } from "next/navigation"
import GuestUser from "@/components/BuilderComponents/GuestUser"
import { PreviewContainer } from "@/components/BuilderComponents/PreviewContainer"
import LoadingResumeState from "@/components/BuilderComponents/LoadingResumeState"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "@/lib/analytics/events"

/**
 * All Resumes Page
 * 
 * Displays all user resumes in a grid layout with:
 * - Resume count in header
 * - Grid of resume preview cards
 * - Fixed bottom action bar with "Add New" and "Upload PDF" buttons
 * - Same functionality as the old builder page
 */
const AllResumesPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [creating, setCreating] = useState(false)
  const router = useRouter()

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
        source: 'all_resumes',
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

  const handleResumeDeleted = useCallback(async () => {
    await refetch()
  }, [refetch])

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

  const hasResumes = resumes && resumes.length > 0

  return (
    <section className="w-full flex items-center justify-center dark:text-white">
      <div
        className={`p-4 w-full max-w-[850px] ${hasResumes ? "place-self-start" : "md:place-self-end"} transition-opacity duration-300 anim-fade-in-soft`}
      >
        {hasResumes ? (
          <>
            <div className="w-full flex items-center justify-between">
              <h3 className="w-full text-left font-medium text-2xl border-b border-gray-300 dark:border-slate-600 mb-4 pb-2">
                All Resumes{" "}
                <span className="font-bold text-xs text-gray-500 dark:text-gray-400">{resumes.length} in total</span>
              </h3>
            </div>
            <div className="w-full h-fit grid grid-cols-3 max-[500px]:grid-cols-2 gap-4 items-start justify-center mb-32 sm:mb-24">
              {resumes.map((resume) => (
                <PreviewContainer key={resume.id} resume={resume} onDeleted={handleResumeDeleted} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center mb-6 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
              Let&apos;s get started <Rocket className="animate-pulse text-teal-500" />
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Create your first resume to begin. You can always add, edit, preview or delete drafts later.
            </p>
          </div>
        )}
      </div>

      {/* Fixed action bar - positioned above mobile bottom nav */}
      <div className="w-full grid place-items-center p-4 gap-2 fixed bottom-0 sm:bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-slate-700 mb-0 sm:mb-0" style={{ bottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
        <div className="flex gap-2 items-center pb-16 sm:pb-0">
          <Button variant="primary" size="medium" onClick={handleCreateResume} disabled={creating}>
            {creating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New
              </span>
            )}
          </Button>
          <Link href="/builder/resumes/build">
            <Button variant="secondary" size="medium">
              <File className="h-4 w-4" /> Upload PDF
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AllResumesPage
