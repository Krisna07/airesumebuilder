"use client"
import type React from "react"
import { useState, useCallback } from "react"
import Button from "../Ui/Button"
import { ResumeService } from "@/services/resumeServices"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { File, Loader2, Plus } from "lucide-react"
import { useToast } from "@/context/PopupContext"

interface LoggedInUserProps {
  userId: string
}

const LoggedInUser: React.FC<LoggedInUserProps> = ({ userId }) => {
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleCreateResume = useCallback(async () => {
    if (creating) return // Prevent double-clicks

    setCreating(true)
    try {
      const response = await ResumeService.create(userId)
      const data = await response.json()

      if (!response.ok) {
        toast.showToast(data.message || response.statusText, "error", 3000)
        return
      }

      toast.showToast("Resume created successfully", "success", 3000)
      router.push(`/builder/resumes/${data.data.id}`)
    } catch (error) {
      console.error("Error creating resume:", error)
      toast.showToast("Failed to create resume", "error", 3000)
    } finally {
      setCreating(false)
    }
  }, [creating, userId, router, toast])

  return (
    <div className="w-full grid place-items-center place-self-end md:place-self-start sticky bottom-0 p-4 gap-2">
      <div className="flex gap-2 items-center">
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
            <File className="h-4 w-4" /> Upload Existing PDF
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default LoggedInUser
