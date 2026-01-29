
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/subscription-server'
import { safeJsonParse, validateResumeData } from '@/utils/dataValidation'

const MAX_JSON_BYTES = 2_000_000 // ~2MB

function getContentLength(req: NextRequest) {
  const raw = req.headers.get('content-length')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

async function getAuthedUserId() {
  const { userId } = await requireUserSession()
  return userId
}

function forbiddenOrNotFound() {
  // Avoid leaking existence of other users' resumes.
  return NextResponse.json({ error: "Resume not found" }, { status: 404 });
}



export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthedUserId()
        // For GET, use query params, not req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        console.log(`Fetching resume with id: ${id}`);
        const resume = await prisma.resume.findFirst({ where: { id, userId } })
        if (!resume || resume.deleted) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        const responseData = {
            id: resume?.id, 
               title:resume?.title, 
               template:resume?.template, 
               profile: safeJsonParse(resume?.profile as string, {}),
               skills: safeJsonParse(resume?.skills as string, []),
               experiences: safeJsonParse(resume?.experiences as string, []),
               educations: safeJsonParse(resume?.educations as string, []),
                customSections: resume?.customSections ?
                    (() => {
                        try {
                            const parsed = JSON.parse(resume.customSections as string);
                            return Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            console.warn('Failed to parse customSections:', e);
                            return [];
                        }
                    })() : [],
               updated: resume?.updatedAt,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                matchingScore: (resume as any)?.matchingScore ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                analyzedAt: (resume as any)?.analyzedAt ?? null
        }
        return NextResponse.json({ data: responseData }, { status: 200 });
    } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({

            error: (err instanceof Error ? err.message : 'Unknown error')
        }, { status: 500 });
    }
}


export async function PUT(req: NextRequest) {
    try {
        const userId = await getAuthedUserId()

        const len = getContentLength(req)
        if (len !== null && len > MAX_JSON_BYTES) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
        }

        const raw = await req.json();
        if (!raw || typeof raw !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }
        const resumeData = validateResumeData((raw ?? {}) as Record<string, unknown>)
        const resumeId  = resumeData.id || randomUUID();
        const existing = await prisma.resume.findFirst({ where: { id: resumeId, deleted: false } })
        if (!existing) {
          const newResume = {
            id: resumeId,
            userId,
            title: resumeData.title || '',
              template: resumeData.template ?? 'Classic',
              profile: JSON.stringify(resumeData.profile || {}),
              experiences: JSON.stringify(resumeData.experiences || []),
              educations: JSON.stringify(resumeData.educations || []),
              skills: JSON.stringify(resumeData.skills || []),
              customSections: JSON.stringify(resumeData.customSections || []),
          };
        const createdResume = await prisma.resume.create({ data: newResume });
            return NextResponse.json({
             data: {
                    id: createdResume.id,
                    title: createdResume.title,
                    template: createdResume.template,
                    profile: typeof createdResume.profile === "string"  ? safeJsonParse(createdResume.profile, {}) : {},
                    experiences: typeof createdResume.experiences === "string"  ? safeJsonParse(createdResume.experiences, []) : [],
                    educations: typeof createdResume.educations === "string"  ? safeJsonParse(createdResume.educations, []) : [],
                    skills: typeof createdResume.skills === "string"  ? safeJsonParse(createdResume.skills, []) : [],
                    customSections: typeof createdResume.customSections === "string" ? safeJsonParse(createdResume.customSections, []) : [],
                 updated: createdResume.updatedAt,
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                 matchingScore: (createdResume as any)?.matchingScore ?? null,
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                 analyzedAt: (createdResume as any)?.analyzedAt ?? null,
             },
         }, { status: 200 });
        }
        if (existing.userId !== userId) {
            return forbiddenOrNotFound()
        }
        const updatedResume = await prisma.resume.update({
            where: { id: resumeData.id },
            data: {
                title: resumeData.title,
                template: resumeData.template,
                profile: JSON.stringify(resumeData.profile),
                experiences: JSON.stringify(resumeData.experiences),
                educations: JSON.stringify(resumeData.educations),
                skills: JSON.stringify(resumeData.skills),
                customSections: JSON.stringify(resumeData.customSections),
            }
        });

        return NextResponse.json({
            data: {
                id: updatedResume.id,
                data: {
                    id: updatedResume.id,
                    title: updatedResume.title,
                    template: updatedResume.template,
                    profile: typeof updatedResume.profile === "string" ? safeJsonParse(updatedResume.profile, {}) : {},
                    experiences: typeof updatedResume.experiences === "string"  ? safeJsonParse(updatedResume.experiences, []) : [],
                    educations: typeof updatedResume.educations === "string"  ? safeJsonParse(updatedResume.educations, []) : [],
                    skills: typeof updatedResume.skills === "string"  ? safeJsonParse(updatedResume.skills, []) : [],
                    customSections: typeof updatedResume.customSections === "string" ? safeJsonParse(updatedResume.customSections, []) : [],
                    updated: updatedResume.updatedAt,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    matchingScore: (updatedResume as any)?.matchingScore ?? null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    analyzedAt: (updatedResume as any)?.analyzedAt ?? null,
                }
            }
        }, { status: 201 });
    } catch (err) {
        console.log(err)
        if (err instanceof Error && err.name === 'AuthError') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getAuthedUserId()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        if (!id) {
            return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
        }
        const existing = await prisma.resume.findFirst({ where: { id, deleted: false } })
        if (!existing) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        if (existing.userId !== userId) {
            return forbiddenOrNotFound()
        }
        await prisma.resume.update({
            where: { id: existing.id },
            data: { deleted: true }
        });
        return NextResponse.json({ data: "Resume deleted successfully" }, { status: 200 });
    } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}
