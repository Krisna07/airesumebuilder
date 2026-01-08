"use client"
import type React from "react"
import { memo, useState, useCallback } from "react"
import JobDescription from "@/components/Forms/JobDescription"
import Button from "@/components/UI/Button"
import JobAnalysisReport from "@/components/UI/JobAnalysisReport"
import { BotIcon, CircleUser as FileUser, Search } from "lucide-react"
import type { AnalysisResult, ResumeData } from "@/types/types"

interface ReportsPanelProps {
  reports: boolean
  analysisData: AnalysisResult[]
  selectedAnalysis: AnalysisResult | null
  setSelectedAnalysis: (analysis: AnalysisResult) => void
  handleReAnalysis: (analysis: AnalysisResult) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRegenerate: (resumeData: ResumeData, analysis?: any, jobDescription?: any) => Promise<void>
  resumeData: ResumeData
  analyzing: boolean
  generating: boolean
  reportsRef: React.RefObject<HTMLDivElement | null>
  generatingCoverLetter: boolean
  generateCoverLetter: (analysis: AnalysisResult) => void
}

const ReportItem = memo(function ReportItem({
  analysis,
  isSelected,
  isProcessing,
  generating,
  generatingCoverLetter,
  analyzing,
  onSelect,
  onOptimize,
  onCoverLetter,
  onReAnalyze,
}: {
  analysis: AnalysisResult
  isSelected: boolean
  isProcessing: boolean
  generating: boolean
  generatingCoverLetter: boolean
  analyzing: boolean
  onSelect: () => void
  onOptimize: () => void
  onCoverLetter: () => void
  onReAnalyze: () => void
}) {

  return (
    <div
      onClick={onSelect}
      className={`
        py-3 px-3 m-1 rounded-lg shadow-sm border cursor-pointer transition-all
        dark:bg-slate-800 dark:border-slate-700
        ${isSelected
          ? "ring-2 ring-teal-400 border-teal-400 bg-teal-50/50 dark:bg-teal-900/20"
          : "border-slate-200 hover:border-teal-300 bg-white dark:hover:border-teal-600"
        }
        ${isProcessing ? "animate-pulse" : ""}
      `}
    >
      <JobAnalysisReport {...analysis} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button
          disabled={generating || generatingCoverLetter}
          variant="primary"
          className={`w-fit ${isSelected && generatingCoverLetter ? "animate-pulse" : ""}`}
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onOptimize()
          }}
        >
          <BotIcon size={14} />
          {isSelected && generating ? "Optimising..." : "Optimise Resume"}
        </Button>
        <Button
          disabled={generating || generatingCoverLetter}
          variant="secondary"
          className={`w-fit ${isSelected && generatingCoverLetter ? "animate-pulse" : ""}`}
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onCoverLetter()
          }}
        >
          <FileUser size={14} />
          {isSelected && generatingCoverLetter ? "Generating..." : "Cover Letter"}
        </Button>
        <Button
          variant="ghost"
          size="small"
          className="w-fit"
          onClick={(e) => {
            e.stopPropagation()
            onReAnalyze()
          }}
        >
          <Search size={14} />
          {isSelected && analyzing ? "Analysing..." : "Re-Analyse"}
        </Button>
      </div>
    </div>
  )
})

const ReportsPanel = memo(function ReportsPanel({
  reports,
  analysisData,
  selectedAnalysis,
  setSelectedAnalysis,
  handleReAnalysis,
  handleRegenerate,
  resumeData,
  analyzing,
  generating,
  reportsRef,
  generatingCoverLetter,
  generateCoverLetter,
}: ReportsPanelProps) {
  const [showJobForm, setShowJobForm] = useState(false)

  const handleOptimize = useCallback(
    (analysis: AnalysisResult) => {
      handleRegenerate(resumeData, analysis)
    },
    [handleRegenerate, resumeData],
  )

  const handleCoverLetter = useCallback(
    (analysis: AnalysisResult) => {
      generateCoverLetter(analysis)
    },
    [generateCoverLetter],
  )

  const toggleJobForm = useCallback(() => {
    setShowJobForm((prev) => !prev)
  }, [])

  const hasReports = reports && analysisData?.length > 0

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      ref={reportsRef}
      className="w-full h-full flex flex-col shadow-sm rounded-lg bg-white dark:bg-slate-900"
    >
      {hasReports ? (
        <div className="pt-4 px-4 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Analysis Reports</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {analysisData.length} report{analysisData.length !== 1 ? "s" : ""} available
          </p>

          <div className="overflow-auto mt-3 flex-1">
            {analysisData.map((analysis, index) => {
              const isSelected = selectedAnalysis?.id === analysis.id
              return (
                <ReportItem
                  key={analysis.id || index}
                  analysis={analysis}
                  isSelected={isSelected}
                  isProcessing={isSelected && (generatingCoverLetter || generating)}
                  generating={generating}
                  generatingCoverLetter={generatingCoverLetter}
                  analyzing={analyzing}
                  onSelect={() => setSelectedAnalysis(analysis)}
                  onOptimize={() => handleOptimize(analysis)}
                  onCoverLetter={() => handleCoverLetter(analysis)}
                  onReAnalyze={() => handleReAnalysis(analysis)}
                />
              )
            })}
          </div>

          <div className="py-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <JobDescription
              resumeId={resumeData.id}
              hideAnalysis={true}
              hideTitle={true}
              handleRegenerate={handleRegenerate}
              resumeData={resumeData}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">No Analysis Yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
              Add a job description to analyze your resume against it
            </p>
            <Button variant="primary" size="small" onClick={toggleJobForm}>
              {showJobForm ? "Hide Form" : "Add Job Description"}
            </Button>
            {showJobForm && (
              <div className="w-full mt-4">
                <JobDescription resumeId={resumeData.id} hideAnalysis={true} />
              </div>
            )}
        </div>
      )}
    </div>
  )
})

export default ReportsPanel
