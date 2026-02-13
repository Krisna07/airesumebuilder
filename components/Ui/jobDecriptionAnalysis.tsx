"use client"
import type React from "react"
import { useState, useCallback, memo, useEffect } from "react"
import Button from "./Button"
import type { AnalysisResult, JobDescription, JobDetailsWithAnalysis, ResumeData } from "@/types/types"
import { analyzeResume } from "@/services/resumeServices"
import { BarChart, BotIcon, ChevronDown } from "lucide-react"
import JobAnalysisReport from "./JobAnalysisReport"
import { useToast } from "@/context/PopupContext"
import { UseQueryResult } from "@tanstack/react-query"

interface Props {
    job: JobDetailsWithAnalysis
    resumeId?: string
    itemKey?: number | string
    handleRegenerate?: (resumeData: ResumeData, analysis?: AnalysisResult) => Promise<void>
    resumeData?: ResumeData
    response: UseQueryResult<{ status: number; data: JobDetailsWithAnalysis[]; }, Error>
}

const JobDescriptionAnalysis: React.FC<Props> = memo(function JobDescriptionAnalysis({
    job,
    resumeId,
    handleRegenerate,
    resumeData,
    response
}) {
    const [analyzing, setAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
    const { showToast } = useToast()

    const [showDescription, setShowDescription] = useState(false)

    // parse initial analysis only when job changes
    useEffect(() => {
        if (job?.hasAnalysed && job?.analysis?.result) {
            try {
                const parsed = typeof job.analysis.result === 'string' ? JSON.parse(job.analysis.result as string) : job.analysis.result
                setAnalysis(parsed)
            } catch (err) {
                console.warn('Failed to parse initial analysis for job', job.id, err)
                setAnalysis(null)
            }
        } else {
            setAnalysis(null)
        }
    }, [job])

    const toggleDescription = useCallback(() => {
        setShowDescription((prev) => !prev)
    }, [])

    const startAnalysis = useCallback(
        async (jobDetails: JobDescription) => {
            if (!resumeId || !jobDetails.description) return

            setAnalyzing(true)
            try {
                const result = await analyzeResume({ resumeId, jobDetails })

                if (result.status !== 200) {
                    showToast("Error analysing resume", "warning", 3000)
                    return
                }

                const parsed = result.data?.result ? (typeof result.data.result === 'string' ? JSON.parse(result.data.result) : result.data.result) : null
                setAnalysis(parsed)
                // defensive: call refetch only if available
                try { response?.refetch?.(); } catch { }
                showToast("Resume analysed successfully", "success", 3000)
            } catch (err) {
                showToast("Error analysing resume", "warning", 3000)
                console.error("Analysis error:", err)
            } finally {
                setAnalyzing(false)
            }
        },
        [resumeId, showToast, response],
    )

    const handleOptimize = useCallback(() => {
        if (resumeData && handleRegenerate && analysis) {
            handleRegenerate(resumeData, analysis)
        }
    }, [resumeData, handleRegenerate, analysis])


    return (
        <div className=" grid gap-3 mt-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4  dark:bg-slate-800">
            {/* Job info header - only show if no analysis yet */}
            {!analysis && <>
                <div className="w-full text-xs gap-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Position</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{job?.title ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Location</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{job?.location ?? "—"}</p>
                    </div>
                </div>

                {showDescription && (
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Description</p>
                        <div className="w-full max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 rounded-md p-3 bg-slate-50 dark:bg-slate-900">
                            {job.description ?? "—"}
                        </div>
                    </div>
                )}
                <div className="flex gap-2 flex-col min-[1000px]:flex-row items-stretch sm:items-center ">
                    <Button
                        size="small"
                        variant="ghost"
                        className=" w-full text-xs text-slate-500 whitespace-nowrap dark:text-slate-400"
                        onClick={toggleDescription}
                    >
                        <ChevronDown size={12} className={`transition-transform ${showDescription ? "rotate-180" : "rotate-0"}`} />
                        {showDescription ? "Hide description" : "View description"}
                    </Button>

                    <div className="w-full flex gap-2 flex-col sm:flex-row">
                        {resumeData && handleRegenerate && (
                            <Button variant="primary" className=" w-full whitespace-nowrap" size="small" onClick={handleOptimize}>
                                <BotIcon size={14} />
                                Optimise Resume
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => startAnalysis(job)}
                            disabled={analyzing}
                            className={` w-full ${analyzing ? "animate-pulse" : ""}`}
                        >
                            <BarChart size={14} />  {analyzing ? "Analyzing…" : job?.hasAnalysed ? "Re-analyse" : "Analyse"}
                        </Button>
                    </div>
                </div></>
            }
            {/* Analysis report */}
            {job.hasAnalysed && (
                <>
                    {analysis ? (
                        <>
                            <JobAnalysisReport analysis={{ ...analysis, company: job.company }} />
                            {showDescription && (
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Description</p>
                                    <div className="w-full max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 rounded-md p-3 bg-slate-50 dark:bg-slate-900">
                                        {job.description ?? "—"}
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                                <Button
                                    size="small"
                                    variant="ghost"
                                    className="text-xs text-slate-500 dark:text-slate-400 w-full sm:w-fit"
                                    onClick={toggleDescription}
                                >
                                    <ChevronDown size={12} className={`transition-transform ${showDescription ? "rotate-180" : "rotate-0"}`} />
                                    {showDescription ? "Hide description" : "View description"}
                                </Button>

                                <div className="flex gap-2 flex-col sm:flex-row">
                                    {resumeData && handleRegenerate && (
                                        <Button variant="primary" className="w-full sm:w-fit" size="small" onClick={handleOptimize}>
                                            <BotIcon size={14} />
                                            Optimise Resume
                                        </Button>
                                    )}

                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={() => startAnalysis(job)}
                                        disabled={analyzing}
                                        className={`w-full sm:w-fit ${analyzing ? "animate-pulse" : ""}`}
                                    >
                                        {analyzing ? "Analyzing…" : job?.hasAnalysed ? "Re-analyse" : "Analyse"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                            <div className="animate-spin">
                                <BotIcon size={24} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Loading analysis report...</p>
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => startAnalysis(job)}
                                disabled={analyzing}
                                className="mt-2"
                            >
                                Retry Analysis
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
})

export default JobDescriptionAnalysis
