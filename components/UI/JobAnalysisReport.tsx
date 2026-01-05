
import { AnalysisResult } from '@/types/types'
import React, { useState, useEffect } from 'react'

const generateReport = (match: number): { label: string; colorClass: string; description: string } => {
    let score = Number(match ?? 0)
    if (Number.isNaN(score)) score = 0
    score = Math.max(0, Math.min(100, Math.round(score)))

    if (score >= 90) {
        return {
            label: 'Excellent',
            colorClass: 'text-green-600',
            description: `Outstanding match (${score}%). Your resume aligns very closely with the job requirements. Highlight these strengths and consider small tweaks to reach perfection.`,
        }
    }

    if (score >= 70) {
        return {
            label: 'Good',
            colorClass: 'text-green-400',
            description: `Good match (${score}%). Your resume meets many key requirements — a few targeted improvements could make it even stronger.`,
        }
    }

    if (score >= 50) {
        return {
            label: 'Bad',
            colorClass: 'text-orange-500',
            description: `Below average match (${score}%). Important skills or keywords are missing. Consider adding relevant experience and keywords from the job description.`,
        }
    }

    if (score >= 30) {
        return {
            label: 'Poor',
            colorClass: 'text-amber-600',
            description: `Poor match (${score}%). Your resume needs significant improvement to align with this role. Focus on core skills, achievements, and relevant keywords.`,
        }
    }

    return {
        label: 'Very Bad',
        colorClass: 'text-red-600',
        description: `Very low match (${score}%). Major gaps exist between your resume and the job requirements. Rework your resume to closely reflect the job's responsibilities and qualifications.`,
    }
}

const JobAnalysisReport = (analysis: AnalysisResult) => {
    const [showDetails, updateShowDetails] = useState(false)
    // Ensure matching percentage is a finite number between 0 and 100
    const raw = Number(analysis.matchingPercentage ?? 0)
    const percent = Number.isFinite(raw) && !Number.isNaN(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 0
    const dashOffset = String(100 - percent)

    // Animated values for the chart
    const [animatedOffset, setAnimatedOffset] = useState<string>('100')
    const [displayPercent, setDisplayPercent] = useState<number>(0)

    // Trigger animations whenever percent changes
    useEffect(() => {
        // reset to full circle then animate to target offset
        setAnimatedOffset('100')
        const t = setTimeout(() => setAnimatedOffset(dashOffset), 50)

        // animate the numeric counter from 0 -> percent
        const duration = 900
        let start: number | null = null
        let rafId = 0
        const step = (timestamp: number) => {
            if (start === null) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(1, elapsed / duration)
            const value = Math.round(progress * percent)
            setDisplayPercent(value)
            if (progress < 1) rafId = requestAnimationFrame(step)
        }
        rafId = requestAnimationFrame(step)

        return () => {
            clearTimeout(t)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [dashOffset, percent])

    const report = generateReport(percent)
    return (
        <div className='w-full bg-white  rounded text-xs grid gap-2 shadow-[0_0_2px_0_gray'>
            <div className='w-full grid gap-1'>
                <div className='flex items-center justify-between'>
                    <div className=''>
                        <p className='text-xs text-slate-500'>Position</p>
                        <p className=' text-slate-700'>{analysis?.role ?? '—'}</p>
                        <p className='text-xs text-slate-600 font-semibold'>{report.label}</p>
                    </div>
                    <div className="relative  sm:min-w-[100px] w-[100px]">
                        <svg className="size-full rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current " strokeWidth={0}></circle>
                            <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className={`stroke-current ${percent > 50 ? report.colorClass : ''}`}
                                strokeWidth={2}
                                strokeDasharray={100}
                                strokeDashoffset={animatedOffset}
                                style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                            <span className=" font-bold text-green-600 dark:text-blue-400">{displayPercent}%</span>
                            <span className={`font-semibold text-[12px] ${percent > 50 ? 'text-green-400' : 'text-orange-500'}`}>{percent > 90 ? 'Very Good' : ''}</span>
                        </div>
                    </div>

                </div>
                <div className='min-w-full flex items-center justify-between'>
                    <div className=''>
                        <span>Summary</span>
                        <p className='text-xs text-slate-600'>{showDetails ? analysis.description : analysis.description.slice(0, (50 * analysis.description.length) / 100)}</p>
                    </div>

                </div>

                {showDetails && <>
                    <div className=''>
                        <span className='font-semibold mt-2.5'>Missing keywords</span>
                        <div className='flex flex-wrap gap-x-2 gap-y-1 mt-1'>
                            {analysis?.missingKeywords?.map((keywords: string, count: number) => (
                                <span key={count} className='text-xs text-slate-600 bg-slate-300 rounded-4xl px-2'>
                                    {keywords}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className='w-full max-[600px]:grid flex gap-4 justify-between  px-4 '>
                        <div className='w-full '>
                            <span className='font-semibold'>Strenght Highlighted In Resume</span>
                            {analysis?.strengths?.map((strength: string, count: number) => (
                                <li key={count} className='text-xs text-slate-600'>
                                    {strength}
                                </li>
                            ))}
                        </div>
                        <div className='w-full'>
                            <span className='font-semibold'>AI Suggestions</span>
                            {analysis?.suggestions?.map((suggestion: string, count: number) => (
                                <li key={count} className='text-xs text-slate-600'>
                                    {suggestion}
                                </li>
                            ))}
                        </div>
                    </div>
                </>}
                <span className='cursor-pointer' onClick={() => updateShowDetails(!showDetails)}>
                    {showDetails ? '...show less' : '...show more'}
                </span>
            </div>
        </div>
    )
}

export default JobAnalysisReport