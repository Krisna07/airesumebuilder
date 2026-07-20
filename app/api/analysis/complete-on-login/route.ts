import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserSession, mapSubscriptionError } from '@/lib/subscription-server'
import type { AnalysisResult, ResumeData } from '@/types/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const ATS_BASELINE_JOB_DESCRIPTION = `You are evaluating a resume against modern ATS standards.
Assess for: clear role targeting, measurable achievements, keyword relevance, section clarity,
skills coverage, formatting readability, and action-oriented bullet quality.
Return practical optimization suggestions for ATS and recruiter readability.`

type CompleteOnLoginPayload = {
  resumeData: ResumeData
  analysis: AnalysisResult
  resumeText?: string
  sourceFileName?: string
}

function ensureResumeDefaults(userId: string, resume: ResumeData): ResumeData {
  return {
    ...resume,
    id: resume.id || randomUUID(),
    userId,
    title: resume.title || 'ATS Optimized Resume',
    template: resume.template || 'modern',
    profile: resume.profile || {
      fullname: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: '',
    },
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    experiences: Array.isArray(resume.experiences) ? resume.experiences : [],
    educations: Array.isArray(resume.educations) ? resume.educations : [],
    customSections: Array.isArray(resume.customSections) ? resume.customSections : [],
  }
}

export async function POST(req: NextRequest) {
  try {
    let userId: string
    try {
      ;({ userId } = await requireUserSession())
    } catch (err) {
      const mapped = mapSubscriptionError(err)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    const body = (await req.json()) as CompleteOnLoginPayload
    if (!body?.resumeData || !body?.analysis) {
      return NextResponse.json({ error: 'resumeData and analysis are required' }, { status: 400 })
    }

    const normalizedResume = ensureResumeDefaults(userId, body.resumeData)
    const resumeId = randomUUID()
    const jobDescriptionId = randomUUID()

    await prisma.resume.create({
      data: {
        id: resumeId,
        userId,
        title: normalizedResume.title,
        template: normalizedResume.template,
        profile: JSON.stringify(normalizedResume.profile),
        experiences: JSON.stringify(normalizedResume.experiences),
        educations: JSON.stringify(normalizedResume.educations),
        skills: JSON.stringify(normalizedResume.skills),
        customSections: JSON.stringify(normalizedResume.customSections || []),
      },
    })

    await prisma.jobDescription.create({
      data: {
        id: jobDescriptionId,
        userId,
        title: 'ATS Standard Audit',
        company: 'AI Resume Craft',
        location: 'Remote',
        domain: 'resume-optimization',
        description: ATS_BASELINE_JOB_DESCRIPTION,
        url: `analysis://ats-standard/${resumeId}`,
      },
    })

    await prisma.analysisResult.create({
      data: {
        id: randomUUID(),
        resumeId,
        jobDescriptionId,
        result: body.analysis as unknown as object,
        matchingScore: Number.isFinite(Number(body.analysis.matchingPercentage))
          ? Number(body.analysis.matchingPercentage)
          : null,
        analyzedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        resumeId,
        jobDescriptionId,
        previewPath: `/builder/resumes/${resumeId}/preview`,
      },
    })
  } catch (error) {
    console.error('complete-on-login error:', error)
    return NextResponse.json({ error: 'Failed to complete post-login optimization' }, { status: 500 })
  }
}
