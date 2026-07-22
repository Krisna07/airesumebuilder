import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { AIService } from '@/services/aiServices'
import { prisma } from '@/lib/prisma'
import { createAnalysisJob, updateAnalysisJob } from '@/lib/analysis-process-store'
import { enforceGuestAnalysisLimit, verifyOrigin } from '@/lib/analysis-guest-guard'
import { consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage'
import { resolveUserIdFromRequest } from '@/lib/auth-user'
import type { ResumeData } from '@/types/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const ATS_BASELINE_JOB_DESCRIPTION = `You are evaluating a resume against modern ATS standards.
Assess for: clear role targeting, measurable achievements, keyword relevance, section clarity,
skills coverage, formatting readability, and action-oriented bullet quality.
Return practical optimization suggestions for ATS and recruiter readability.`

async function persistForUser(userId: string, resumeData: ResumeData, analysis: any, resumeText: string) {
  const resumeId = randomUUID()
  const jobDescriptionId = randomUUID()

  await prisma.resume.create({
    data: {
      id: resumeId,
      userId,
      title: resumeData.title || 'ATS Resume Upload',
      template: resumeData.template || 'modern',
      profile: JSON.stringify(resumeData.profile || {}),
      experiences: JSON.stringify(resumeData.experiences || []),
      educations: JSON.stringify(resumeData.educations || []),
      skills: JSON.stringify(resumeData.skills || []),
      customSections: JSON.stringify(resumeData.customSections || []),
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
      result: analysis,
      matchingScore: Number.isFinite(Number(analysis?.matchingPercentage))
        ? Number(analysis.matchingPercentage)
        : null,
      analyzedAt: new Date(),
    },
  })

  return {
    resumeId,
    previewPath: `/builder/resumes/${resumeId}/preview`,
  }
}

async function processJob(jobId: string, params: { fileBase64: string; fileName?: string; userId?: string | null }) {
  try {
    updateAnalysisJob(jobId, {
      status: 'extracting',
      progress: 10,
      message: 'Extracting text from PDF',
    })

    const fileRaw = params.fileBase64.includes('base64,')
      ? params.fileBase64.split('base64,')[1]
      : params.fileBase64

    const bytes = Buffer.from(fileRaw, 'base64')
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const extracted = await extractText(pdf, { mergePages: true })
    const resumeText = extracted.text || ''

    if (!resumeText.trim()) {
      throw new Error('No extractable text found in PDF')
    }

    updateAnalysisJob(jobId, {
      status: 'parsing',
      progress: 35,
      message: 'Parsing resume structure',
    })

    const resumeData = await AIService.generateResume(undefined, resumeText)

    updateAnalysisJob(jobId, {
      status: 'analyzing',
      progress: 70,
      message: 'Running ATS analysis',
    })

    const analysis = await AIService.analyzeResume(
      resumeData,
      `${ATS_BASELINE_JOB_DESCRIPTION}\n\nResume raw text:\n${resumeText.slice(0, 12000)}`,
    )

    let resumeId: string | undefined
    let previewPath: string | undefined

    if (params.userId) {
      updateAnalysisJob(jobId, {
        status: 'persisting',
        progress: 90,
        message: 'Saving resume and analysis',
      })

      const persisted = await persistForUser(params.userId, resumeData, analysis, resumeText)
      resumeId = persisted.resumeId
      previewPath = persisted.previewPath
    }

    updateAnalysisJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Analysis complete',
      result: {
        resumeData,
        analysis,
        resumeText,
        sourceFileName: params.fileName,
        resumeId,
        previewPath,
      },
    })
  } catch (error) {
    updateAnalysisJob(jobId, {
      status: 'failed',
      progress: 100,
      message: 'Analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const originCheck = verifyOrigin(req)
    if (!originCheck.ok) {
      return originCheck.response
    }

    const body = await req.json()
    const fileBase64 = typeof body?.fileBase64 === 'string' ? body.fileBase64 : ''
    const fileName = typeof body?.fileName === 'string' ? body.fileName : undefined

    if (!fileBase64) {
      return NextResponse.json({ error: 'fileBase64 is required' }, { status: 400 })
    }

    const userId = await resolveUserIdFromRequest(req)

    if (!userId) {
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
    }

    const jobId = randomUUID()
    createAnalysisJob(jobId)

    // Fire-and-track processing in the background for polling.
    void processJob(jobId, { fileBase64, fileName, userId })

    return NextResponse.json({ success: true, data: { jobId } })
  } catch (error) {
    console.error('analysis/process/start error:', error)
    return NextResponse.json({ error: 'Failed to start analysis process' }, { status: 500 })
  }
}
