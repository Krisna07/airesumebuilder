"use client"
import { ResumeService } from "@/services/resumeServices"
import type { ResumeData } from "@/types/types"
import type React from "react"
import { useState, useCallback, memo } from "react"
import Button from "../UI/Button"
import ResumePreview from "../Templates/ResumePreview"
import { Loader2, Trash2 } from "lucide-react"
import ConfirmDialog from "../UI/ConfirmDialog"
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
        tabIndex={0}
        className={`group relative min-h-[300px] w-full overflow-hidden rounded-2xl border border-transparent p-2 shadow-[0_0_4px_0_gray] dark:shadow-slate-700 select-none transition-all duration-300 
          focus-within:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.4)] hover:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.4)] 
          dark:bg-slate-800 ${isGone ? "opacity-0 scale-90 pointer-events-none" : "anim-fade-scale"}`}
      >
        {/* Resume Preview Background */}
        <div
          className={`absolute inset-0 z-10 transition-all duration-500 
            group-hover:blur-[1.5px] group-hover:scale-[1.05] 
            group-focus-within:scale-[1.05] group-focus-within:blur-[1.5px] 
            ${isDeleting ? "grayscale blur-sm opacity-70" : ""}`}
        />

        <div className="-z-10 group-hover:blur-[1.5px] group-hover:scale-[1.05] group-focus-within:scale-[1.05] group-focus-within:blur-[1.5px] transition-all">
          <ResumePreview template={resume.template} resumeData={resume} />
        </div>

        {/* Delete Icon */}
        <Trash2
          onClick={handleShowConfirm}
          className="absolute z-40 right-0 top-0 bg-red-50 dark:bg-red-900/50 p-1.5 rounded-bl-lg translate-x-8 m-0 opacity-0 -translate-y-4 
            group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 
            group-focus-within:opacity-100 group-focus-within:translate-x-0 group-focus-within:translate-y-0 
            transition-all ease-in-out cursor-pointer hover:bg-red-100 dark:hover:bg-red-800"
          color="red"
          size={28}
        />

        {/* Action Buttons */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex translate-y-full gap-2 p-3 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent pt-8
            transition-all duration-500 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0 
            ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
        >
          {hasMinimumData(resume) && (
            <Button onClick={handlePreview} variant="primary" size="small" className="flex-1">
              Preview
            </Button>
          )}
          <Button onClick={handleEdit} variant="secondary" size="small" className="flex-1">
            Edit
          </Button>
          {!hasMinimumData(resume) && (
            <Button
              onClick={handleShowConfirm}
              variant="danger"
              size="small"
              className="flex items-center gap-1"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Del
            </Button>
          )}
        </div>

        {/* Loading Overlay */}
        {isDeleting && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
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
        message={
          <span>
            Delete this incomplete resume? <br />
            This action cannot be undone.
          </span>
        }
        confirmText="Delete"
      />
    </>
  )
})

PreviewContainer.displayName = "PreviewContainer"

export { PreviewContainer }
