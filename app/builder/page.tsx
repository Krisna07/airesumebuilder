"use client"
import Button from "@/components/Ui/Button"
import Link from "next/link"
import { useState, useCallback, useMemo } from "react"
import { Plus, Loader2, UploadCloud, Cross, X } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { ResumeService } from "@/services/resumeServices"
import { useRouter } from "next/navigation"
import GuestUser from "@/components/BuilderComponents/GuestUser"
import { PreviewContainer } from "@/components/BuilderComponents/PreviewContainer"
import LoadingResumeState from "@/components/BuilderComponents/LoadingResumeState"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import FileUploadPage from "./build/FileUploadPage"

const Page = () => {
  const { user, loading: authLoading } = useAuth()
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [upload, setUpload] = useState(false)
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
    enabled: !!user, // Only run query when user exists
    staleTime: 30000, // Cache for 30 seconds
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

      toast.success("Resume created successfully")
      router.push(`/builder/${data.data.id}`)
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
      <section className="w-full min-h-[80vh] flex flex-col items-center justify-center gap-6 px-4 text-center anim-fade-in-soft">
        <div className="space-y-4 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6">
            Build Your Resume <span className="text-teal-500">Faster</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            <Link href={'/auth/signin'} className="text-teal-500 hover:underline font-medium">Sign in</Link> to access your personal dashboard, track your progress, and manage multiple versions.
          </p>
        </div>
        <GuestUser />
      </section>
    )
  }

  // Logged in user state
  const hasResumes = resumes && resumes.length > 0

  return (
    <div className="w-full   bg-gray-50/50 dark:bg-slate-900/50">

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {upload &&
          <div className="w-full h-screen bg-gray-300/50 absolute top-0 left-0 right-0 bottom-0 z-50 grid z-100 items-center justify-center">
            <div className="relative w-fit h-fit">
              <X className="absolute top-2 right-2" onClick={() => {
                setUpload(false)
                setUploading(false)
              }} />
              <FileUploadPage />
            </div>
          </div>
        }
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 anim-fade-in-down">
          <div>
            {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1> */}
            <p className="text-3xl text-gray-500 dark:text-slate-400 mt-1">Welcome back, {user.name?.split(' ')[0]}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => {
              setUpload(true)
              setUploading(true)
            }} variant="ghost" size="medium" className="hidden sm:flex bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 whitespace-nowrap">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Import Resume
            </Button>

            <Button variant="primary" size="medium" onClick={handleCreateResume} disabled={creating} className="shadow-lg shadow-teal-500/20 whitespace-nowrap">
              {creating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Create New
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Resumes Grid */}
        <div className="space-y-6 anim-fade-in-soft delay-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              My Resumes
              <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{resumes?.length || 0}</span>
            </h3>
          </div>

          {hasResumes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {resumes.map((resume) => (
                <PreviewContainer key={resume.id} resume={resume} onDeleted={handleResumeDeleted} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
              <div className="h-16 w-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resumes yet</h3>
              <p className="text-gray-500 dark:text-slate-400 text-center max-w-sm mb-6">
                Create your first resume to start matching with your dream jobs.
              </p>
              <Button variant="primary" size="medium" onClick={handleCreateResume} disabled={creating}>
                Create Resume
              </Button>
              </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Page
