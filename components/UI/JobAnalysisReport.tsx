"use client"
import type { AnalysisResult } from "@/types/types"
import { useState, useEffect, useMemo, memo, useCallback } from "react"

const generateReport = (match: number): { label: string; colorClass: string; bgClass: string; description: string } => {
    let score = Number(match ?? 0)
    if (Number.isNaN(score)) score = 0
    score = Math.max(0, Math.min(100, Math.round(score)))

    if (score >= 90) {
        return {
            label: "Excellent",
            colorClass: "text-teal-600",
            bgClass: "bg-teal-100 dark:bg-teal-900/30",
            description: `Outstanding match (${score}%). Your resume aligns very closely with the job requirements.`,
        }
    }
    if (score >= 70) {
        return {
            label: "Good",
            colorClass: "text-teal-500",
            bgClass: "bg-teal-50 dark:bg-teal-900/20",
            description: `Good match (${score}%). Your resume meets many key requirements — a few improvements could make it stronger.`,
        }
    }
    if (score >= 50) {
        return {
            label: "Fair",
            colorClass: "text-amber-500",
            bgClass: "bg-amber-50 dark:bg-amber-900/20",
            description: `Below average match (${score}%). Consider adding relevant experience and keywords from the job description.`,
        }
    }
    if (score >= 30) {
        return {
            label: "Poor",
            colorClass: "text-orange-500",
            bgClass: "bg-orange-50 dark:bg-orange-900/20",
            description: `Poor match (${score}%). Focus on core skills, achievements, and relevant keywords.`,
        }
    }
    return {
        label: "Needs Work",
        colorClass: "text-red-500",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        description: `Very low match (${score}%). Major gaps exist. Rework your resume to reflect the job's requirements.`,
    }
}
interface JobAnalysisReportProps {
    analysis: AnalysisResult & {
        company?: string | null
    }
}

const JobAnalysisReport = memo(function JobAnalysisReport({ analysis }: JobAnalysisReportProps) {
    const [showDetails, setShowDetails] = useState(false)
    const percent = useMemo(() => {
    const raw = Number(analysis.matchingPercentage ?? 0)
        return Number.isFinite(raw) && !Number.isNaN(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 0
    }, [analysis.matchingPercentage])

    const dashOffset = useMemo(() => String(100 - percent), [percent])
    const report = useMemo(() => generateReport(percent), [percent])

    // Animation state
    const [animatedOffset, setAnimatedOffset] = useState("100")
    const [displayPercent, setDisplayPercent] = useState(0)

    useEffect(() => {
        setAnimatedOffset("100")
        const timeout = setTimeout(() => setAnimatedOffset(dashOffset), 50)

        const duration = 900
        let start: number | null = null
        let rafId = 0

        const step = (timestamp: number) => {
            if (start === null) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(1, elapsed / duration)
            setDisplayPercent(Math.round(progress * percent))
            if (progress < 1) rafId = requestAnimationFrame(step)
        }

        rafId = requestAnimationFrame(step)

        return () => {
            clearTimeout(timeout)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [dashOffset, percent])

    const toggleDetails = useCallback(() => {
        setShowDetails((prev) => !prev)
    }, [])

    const truncatedDescription = useMemo(() => {
        if (showDetails) return analysis.description
        const cutoff = Math.floor(analysis.description.length * 0.5)
        return analysis.description.slice(0, cutoff)
    }, [showDetails, analysis.description])

    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-lg text-xs shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="w-full grid gap-3">
                {/* Header with role and score */}
                <div className="flex items-center justify-between">
                    <div className="grid gap-2">
                        <div>  <p className="text-xs text-slate-500 dark:text-slate-400">Position</p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{analysis?.role ?? "—"}</p>
                            <span className={`text-xs font-semibold ${report.colorClass}`}>{report.label}</span></div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Company</p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{analysis?.company ?? "—"}</p>
                        </div>
                    </div>


                    {/* Circular progress */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className="stroke-slate-200 dark:stroke-slate-700"
                                strokeWidth={2}
                            />
                            <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className={`stroke-current ${report.colorClass}`}
                                strokeWidth={2}
                                strokeDasharray={100}
                                strokeDashoffset={animatedOffset}
                                style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-lg font-bold ${report.colorClass}`}>{displayPercent}%</span>
                            {percent >= 70 && <span className="text-[10px] text-teal-500">Match</span>}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Summary</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {truncatedDescription}
                        {!showDetails && "..."}
                    </p>
                </div>

                {/* Expandable details */}
                {showDetails && (
                    <>
                        {/* Missing keywords */}
                        {analysis?.strengths && analysis?.strengths.length > 0 && (
                            <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Missing Keywords</span>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {analysis.missingKeywords && analysis?.missingKeywords?.length > 0 && analysis.missingKeywords.map((keyword, i) => (
                                        <span
                                            key={i}
                                            className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths and Suggestions */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {analysis?.strengths && analysis.strengths.length > 0 && (
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Strengths</span>
                                    <ul className="mt-1 space-y-1">
                                        {analysis.strengths.map((strength, i) => (
                                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                                                <span className="text-teal-500 mt-0.5">•</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {analysis?.suggestions?.length > 0 && (
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">AI Suggestions</span>
                                    <ul className="mt-1 space-y-1">
                                        {analysis.suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                                                <span className="text-amber-500 mt-0.5">•</span>
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Toggle button */}
                <button
                    onClick={toggleDetails}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors text-left"
                >
                    {showDetails ? "← Show less" : "Show more →"}
                </button>
            </div>
        </div>
    )
})

export default JobAnalysisReport
