import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();



export async function GET(req: NextRequest) {
    try {
        // For GET, use query params, not req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        console.log(`Fetching resume with id: ${id}`);
        const resume = await prisma.resume.findFirst({ where: { id } })
        if (!resume || resume.deleted) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        const description = await prisma.jobDescription.findFirst({ where: { resumeId: resume.id } });
        // console.log(resume);
        return NextResponse.json({
            data: {
               id:resume?.id, 
               title:resume?.title, 
               template:resume?.template, 
               profile: resume?.profile ? JSON.parse(resume.profile as string) : {},
               skills: resume?.skills ? JSON.parse(resume.skills as string) : [],
               experiences:resume?.experiences ? JSON.parse(resume.experiences as string) : [],
               educations:resume?.educations ? JSON.parse(resume.educations as string) : [],
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
                analyzedAt: (resume as any)?.analyzedAt ?? null,
                description: description?.description,
            }
        }, { status: 200 });
    } catch (err) {
        return NextResponse.json({

            error: (err instanceof Error ? err.message : 'Unknown error')
        }, { status: 500 });
    }
}


export async function PUT(req: NextRequest) {
    try {
        const resumeData = await req.json();
        const resumeId  = resumeData.id || randomUUID();
        const existing = await prisma.resume.findFirst({ where: { id: resumeId } })
        if (!existing) {
          const newResume = {
            id: resumeId,
            userId: resumeData.userId,
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
                    profile: typeof createdResume.profile === "string"  ? JSON.parse(createdResume.profile) : {},
                    experiences: typeof createdResume.experiences === "string"  ? JSON.parse(createdResume.experiences) : [],
                    educations: typeof createdResume.educations === "string"  ? JSON.parse(createdResume.educations) : [],
                    skills: typeof createdResume.skills === "string"  ? JSON.parse(createdResume.skills) : [],
                    customSections: typeof createdResume.customSections === "string" ? JSON.parse(createdResume.customSections) : [],
                 updated: createdResume.updatedAt,
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                 matchingScore: (createdResume as any)?.matchingScore ?? null,
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                 analyzedAt: (createdResume as any)?.analyzedAt ?? null,
             },
         }, { status: 200 });
        }
        const updatedResume = await prisma.resume.update({
            where: { id: resumeData.id },
            data: {
                userId: resumeData.userId,
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
                    profile: typeof updatedResume.profile === "string" ? JSON.parse(updatedResume.profile) : {},
                    experiences: typeof updatedResume.experiences === "string"  ? JSON.parse(updatedResume.experiences) : [],
                    educations: typeof updatedResume.educations === "string"  ? JSON.parse(updatedResume.educations) : [],
                    skills: typeof updatedResume.skills === "string"  ? JSON.parse(updatedResume.skills) : [],
                    customSections: typeof updatedResume.customSections === "string" ? JSON.parse(updatedResume.customSections) : [],
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
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        if (!id) {
            return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
        }
        const existing = await prisma.resume.findFirst({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        await prisma.resume.update({
            where: { id: existing.id },
            data: { deleted: true }
        });
        return NextResponse.json({ data: "Resume deleted successfully" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}
