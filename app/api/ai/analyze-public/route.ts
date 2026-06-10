import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/aiServices'
import { enforceGuestAnalysisLimit, verifyOrigin } from '@/lib/analysis-guest-guard'
import { consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage'
import { ResumeData } from '@/types/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const ATS_BASELINE_JOB_DESCRIPTION = `You are evaluating a resume against modern ATS standards.
Assess for: clear role targeting, measurable achievements, keyword relevance, section clarity,
skills coverage, formatting readability, and action-oriented bullet quality.
Return practical optimization suggestions for ATS and recruiter readability.`

export async function POST(req: NextRequest) {
  try {
    const originCheck = verifyOrigin(req)
    if (!originCheck.ok) {
      return originCheck.response
    }

    try {
      await consumeGuestUsage('analysis', 1)
    } catch (quotaError) {
      const mapped = mapGuestUsageError(quotaError)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    const guestLimit = enforceGuestAnalysisLimit(req)
    if (!guestLimit.allowed) {
      return NextResponse.json({ error: guestLimit.message }, { status: guestLimit.status || 429 })
    }

    const body = await req.json()
    const resumeData = body?.resumeData as ResumeData | undefined
    const resumeText = typeof body?.resumeText === 'string' ? body.resumeText : ''

    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 })
    }

    const analysis = await AIService.analyzeResume(
      resumeData,
      `${ATS_BASELINE_JOB_DESCRIPTION}\n\nResume raw text:\n${resumeText.slice(0, 12000)}`,
    )

    return NextResponse.json({
      success: true,
      data: analysis,
      context: 'ats-standard',
    })
  } catch (error) {
    console.error('Public analyze API error:', error)
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}
