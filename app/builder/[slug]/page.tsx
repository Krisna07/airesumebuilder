"use client"
import type React from "react"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import MultiStepForm from "@/components/Forms/MultiStepForm"
import type { ResumeData } from "@/types/types"
import { useAuth } from "@/context/authContext"
import { useGetResume } from "@/hooks/useResume"
import { Loader2 } from "lucide-react"

const BuilderPage: React.FC = () => {
  const params = useParams()
  const slug = (params?.slug ?? "") as string
  const { user } = useAuth()

  const isGuestResume = slug === "guest-resume"
  const {
    data: apiResume,
    isLoading,
    error,
  } = useGetResume(slug)

  const resumeData = useMemo<ResumeData | null>(() => {
    if (isGuestResume) {
      try {
        const localResume = localStorage.getItem(slug)
        return localResume ? JSON.parse(localResume) : null
      } catch {
        return null
      }
    }
    return apiResume ?? null
  }, [isGuestResume, slug, apiResume])

  // Loading state
  if (!isGuestResume && isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading your resume...</p>
        </div>
      </div>
    )
  }

  // Error or not found state
  if (error || !resumeData) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Resume Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error?.message || "The resume you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => (window.location.href = "/builder")}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Back to Builder
          </button>
        </div>
      </div>
    )
  }

  return <MultiStepForm resumeContent={resumeData} resumeId={slug} userId={user?.id ?? ""} />
}

export default BuilderPage
