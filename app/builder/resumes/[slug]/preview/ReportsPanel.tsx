/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import type React from "react"
import { memo, useState, useCallback, useMemo } from "react"
import JobDescription from "@/components/Forms/JobDescription"
import Button from "@/components/Ui/Button"
import JobAnalysisReport from "@/components/Ui/JobAnalysisReport"
import { BotIcon, CircleUser as FileUser, Search } from "lucide-react"
import type { AnalysisResult, JobDetailsWithAnalysis, ResumeData } from "@/types/types"

interface ReportsPanelProps {
  reports: boolean
  analysisData: AnalysisResult[]
  selectedAnalysis: any | null
  setSelectedAnalysis: (analysis: any) => void
  handleReAnalysis: (analysis: AnalysisResult) => void
  handleRegenerate: (resumeData: ResumeData, analysis?: any, jobDescription?: any) => Promise<void>
  resumeData: ResumeData
  analyzing: boolean
  generating: boolean
  reportsRef: React.RefObject<HTMLDivElement | null>
  generatingCoverLetter: boolean
  generateCoverLetter: (analysis: AnalysisResult) => void
  jobDetails?: JobDetailsWithAnalysis[]
  handleAnalyzeJD?: (jd: JobDetailsWithAnalysis) => void
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
    analysis: any;
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
        ${isSelected && (isProcessing || analyzing) ? "animate-pulse" : ""}
      `}
    >
      <JobAnalysisReport analysis={{ ...analysis, company: analysis._company }} />
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
          disabled={generating || generatingCoverLetter || analyzing}
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
  jobDetails,
  handleAnalyzeJD,
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

  // Sort job descriptions so the one best matching the resume's current role appears first.
  // Scoring: word-overlap between resume title + most-recent experience title vs JD title.
  const sortedJobDetails = useMemo(() => {
    if (!jobDetails || jobDetails.length === 0) return jobDetails;

    const resumeTitle = (resumeData.title || '').toLowerCase();
    const latestExpTitle = (resumeData.experiences?.[0]?.title || '').toLowerCase();
    const roleWords = new Set(
      `${resumeTitle} ${latestExpTitle}`
        .split(/\W+/)
        .filter((w) => w.length > 2),
    );

    if (roleWords.size === 0) return jobDetails;

    return [...jobDetails].sort((a, b) => {
      const score = (jd: JobDetailsWithAnalysis) => {
        const hay = `${jd.title} ${jd.company}`.toLowerCase();
        let s = 0;
        roleWords.forEach((w) => { if (hay.includes(w)) s++; });
        return s;
      };
      return score(b) - score(a);
    });
  }, [jobDetails, resumeData.title, resumeData.experiences]);

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
            {analysisData.map((analysis: any, index) => {
              const isSelected = selectedAnalysis?._analysisId === analysis._analysisId
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
          <div className="w-full flex flex-col p-4 gap-3">
            {jobDetails && jobDetails.length > 0 ? (
              <>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Job Descriptions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select one to run analysis against your resume</p>
                </div>
                <div className="flex flex-col gap-2">
                  {sortedJobDetails?.map((jd) => (
                    <div
                      key={jd.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{jd.title || 'Untitled'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{jd.company || 'Unknown company'}</div>
                      </div>
                      <Button
                        variant="primary"
                        size="small"
                        className="shrink-0"
                        disabled={analyzing}
                        onClick={() => handleAnalyzeJD?.(jd)}
                      >
                        <Search size={13} />
                        {analyzing ? 'Analysing…' : 'Analyse'}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button variant="ghost" size="small" onClick={toggleJobForm}>
                    {showJobForm ? 'Hide Form' : '+ Add Job Description'}
                  </Button>
                  {showJobForm && (
                    <div className="w-full mt-3">
                      <JobDescription resumeId={resumeData.id} hideAnalysis={true} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">No Analysis Yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                    Add a job description to analyze your resume against it
                  </p>
                  <Button variant="primary" size="small" onClick={toggleJobForm}>
                    {showJobForm ? 'Hide Form' : 'Add Job Description'}
                  </Button>
                  {showJobForm && (
                    <div className="w-full mt-4">
                      <JobDescription resumeId={resumeData.id} hideAnalysis={true} />
                    </div>
                  )}
              </div>
            )}
        </div>
      )}
    </div>
  )
})

export default ReportsPanel
