"use client"
import { ResumeService } from "@/services/resumeServices"
import type { ResumeData } from "@/types/types"
import type React from "react"
import { useState, useCallback, memo } from "react"
import Button from "../Ui/Button"
import ResumePreview from "../Templates/ResumePreview"
import { Loader2, Trash2 } from "lucide-react"
import ConfirmDialog from "../Ui/ConfirmDialog"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

interface PreviewContainerProps {
  resume: ResumeData
  onDeleted: (id: string) => void
  index?: number
}

const PreviewContainer: React.FC<PreviewContainerProps> = memo(({ resume, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isGone, setIsGone] = useState(false)
  const router = useRouter()

  const hasMinimumData = useCallback((r: ResumeData) => {
    return !!(r.profile?.fullname && r.profile?.email)
  }, [])

  const performDelete = useCallback(async () => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      const response = await ResumeService.delete(resume.id)
      if (!response.ok) {
        toast.error("Error deleting resume")
        setIsDeleting(false)
        return
      }
      toast.success("Resume deleted")
      setIsGone(true)
      // Delay parent notification for exit animation
      setTimeout(() => onDeleted(resume.id), 350)
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Error deleting resume")
      setIsDeleting(false)
    }
  }, [isDeleting, resume.id, onDeleted])

  const handlePreview = useCallback(() => {
    router.push(`/builder/${resume.id}/preview`)
  }, [router, resume.id])

  const handleEdit = useCallback(() => {
    router.push(`/builder/${resume.id}`)
  }, [router, resume.id])

  const handleShowConfirm = useCallback(() => {
    setShowConfirm(true)
  }, [])

  const handleHideConfirm = useCallback(() => {
    if (!isDeleting) setShowConfirm(false)
  }, [isDeleting])

  return (
    <>
      <div
        className={`group relative flex flex-col h-[380px] w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-xl hover:border-teal-500/30 dark:hover:border-teal-500/30
          ${isGone ? "opacity-0 scale-90 pointer-events-none" : "anim-fade-scale"}`}
      >
        {/* Preview Area */}
        <div 
          onClick={handleEdit}
          className="relative flex-1 w-full overflow-hidden rounded-t-xl bg-gray-100 dark:bg-slate-950 cursor-pointer"
        >
          <div className="absolute inset-x-4 inset-y-4 shadow-sm transition-transform duration-500 group-hover:scale-105 origin-top">
            <ResumePreview template={resume.template} resumeData={resume} />
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* Card Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate" title={resume.title || "Untitled Resume"}>
                {resume.title || "Untitled Resume"}
              </h4>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Updated {new Date(resume.updatedAt || resume.createdAt || new Date()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleEdit} variant="primary" size="small" className="flex-1 h-9">
              Edit
            </Button>
            {hasMinimumData(resume) && (
              <Button onClick={handlePreview} variant="secondary" size="small" className="px-3 h-9 text-gray-500 dark:text-slate-400">
                View
              </Button>
            )}
            <button
              onClick={handleShowConfirm}
              disabled={isDeleting}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Loading Overlay (Delete) */}
        {isDeleting && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-xl">
            <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onCancel={handleHideConfirm}
        onConfirm={performDelete}
        loading={isDeleting}
        title="Delete Resume?"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete Resume"
      />
    </>
  )
})

PreviewContainer.displayName = "PreviewContainer"

export { PreviewContainer }
