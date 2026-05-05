import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { AIService } from '@/services/aiServices'
import { consumeUsage } from '@/lib/subscription-server'

export const runtime = 'nodejs'
export const maxDuration = 60

function toBoolean(value: string | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function isCronEnabled() {
  // Enabled by default for this flow; can be disabled explicitly.
  return !toBoolean(process.env.RESUME_REGEN_CRON_DISABLED || 'false')
}

function isAuthorized(req: Request) {
  const expectedSecret = process.env.RESUME_REGEN_CRON_SECRET || process.env.CRON_SECRET
  if (!expectedSecret) return false

  const header = req.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret') || ''

  return bearer === expectedSecret || headerSecret === expectedSecret
}

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

async function processOneResumeRegeneration(resumeId: string) {
  const lock = await prisma.resume.updateMany({
    where: {
      id: resumeId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenStatus: 'pending',
      deleted: false,
    } as any,
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenStatus: 'running',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenStartedAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenError: null,
    } as any,
  })

  if (lock.count === 0) return { processed: false, reason: 'lock-skipped' }

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
  if (!resume || resume.deleted) {
    return { processed: false, reason: 'resume-missing' }
  }

  try {
    const jobDescription = (resume as any).regenJobDescription as unknown

    const resumeData = {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      template: resume.template,
      profile: safeParseJson(resume.profile, {}),
      experiences: safeParseJson(resume.experiences, []),
      educations: safeParseJson(resume.educations, []),
      skills: safeParseJson(resume.skills, []),
      customSections: safeParseJson(resume.customSections, []),
      styleConfig: safeParseJson((resume as any).styleConfig, undefined),
    }

    const generated = await AIService.generateResume(
      resumeData as any,
      undefined,
      typeof jobDescription === 'string'
        ? jobDescription
        : jobDescription
          ? JSON.stringify(jobDescription)
          : undefined,
    )

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        profile: JSON.stringify(generated.profile || {}),
        experiences: JSON.stringify(generated.experiences || []),
        educations: JSON.stringify(generated.educations || []),
        skills: JSON.stringify(generated.skills || []),
        customSections: JSON.stringify(generated.customSections || []),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenStatus: 'completed',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenFinishedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenError: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenJobDescription: null,
      } as any,
    })

    // Usage is consumed only after successful completion.
    await consumeUsage(resume.userId, 'regen')

    return { processed: true, status: 'completed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown regeneration error'
    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenStatus: 'failed',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenFinishedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
        regenError: message.slice(0, 500),
      } as any,
    })
    return { processed: true, status: 'failed', error: message }
  }
}

async function handleCron(req: Request) {
  if (!isCronEnabled()) {
    return NextResponse.json({ success: true, state: 'skipped', reason: 'RESUME_REGEN_CRON_DISABLED is true' })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 })
  }

  const pending = await prisma.resume.findMany({
    where: {
      deleted: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenStatus: 'pending',
    } as any,
    orderBy: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
      regenRequestedAt: 'asc',
    } as any,
    select: { id: true },
    take: 3,
  })

  if (!pending.length) {
    return NextResponse.json({ success: true, processed: 0, state: 'idle' })
  }

  const results: Array<Record<string, unknown>> = []
  for (const item of pending) {
    const result = await processOneResumeRegeneration(item.id)
    results.push({ resumeId: item.id, ...result })
  }

  return NextResponse.json({ success: true, processed: results.length, results })
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
