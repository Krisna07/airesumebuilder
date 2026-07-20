
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Helper to safely parse a JSON field that may already be a plain JS object
function safeParseJson<T>(value: unknown, fallback: T): T {
    if (value == null) return fallback;
    if (typeof value === 'string') {
        try { return JSON.parse(value) as T; } catch { return fallback; }
    }
    return value as T;
}

function formatResumeResponse(resume: {
    id: string;
    title: string;
    template: string;
    customTemplateName?: string | null;
    customTemplateVersion?: number | null;
    templateSnapshot?: unknown;
    profile: unknown;
    experiences: unknown;
    educations: unknown;
    skills: unknown;
    customSections: unknown;
    updatedAt: Date;
    styleConfig?: unknown;
} & Record<string, unknown>) {
    return {
        id: resume.id,
        title: resume.title,
        template: resume.template,
        customTemplateName: resume.customTemplateName ?? null,
        customTemplateVersion: resume.customTemplateVersion ?? null,
        templateSnapshot: safeParseJson(resume.templateSnapshot, null),
        profile: safeParseJson(resume.profile, {}),
        experiences: safeParseJson(resume.experiences, []),
        educations: safeParseJson(resume.educations, []),
        skills: safeParseJson(resume.skills, []),
        customSections: safeParseJson(resume.customSections, []),
        styleConfig: safeParseJson(resume.styleConfig, null),
        updated: resume.updatedAt,
        matchingScore: resume.matchingScore ?? null,
        analyzedAt: resume.analyzedAt ?? null,
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        console.log(`Fetching resume with id: ${id}`);
        const resume = await prisma.resume.findFirst({
            where: { id },
            select: {
                id: true,
                title: true,
                template: true,
                customTemplateName: true,
                customTemplateVersion: true,
                templateSnapshot: true,
                profile: true,
                experiences: true,
                educations: true,
                skills: true,
                customSections: true,
                styleConfig: true,
                updatedAt: true,
                deleted: true,
            },
        });
        if (!resume || resume.deleted) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        const responseData = formatResumeResponse(resume as unknown as Record<string, unknown> & {
            id: string;
            title: string;
            template: string;
            profile: unknown;
            experiences: unknown;
            educations: unknown;
            skills: unknown;
            customSections: unknown;
            updatedAt: Date;
        });
        return NextResponse.json({ data: responseData }, { status: 200 });
    } catch (err) {
        return NextResponse.json({
            error: (err instanceof Error ? err.message : 'Unknown error')
        }, { status: 500 });
    }
}


export async function PUT(req: NextRequest) {
    try {
        const resumeData = await req.json();
        const resumeId = resumeData.id || randomUUID();
        const existing = await prisma.resume.findFirst({ where: { id: resumeId }, select: { id: true } });

        const sharedFields = {
            title: resumeData.title || '',
            template: resumeData.template ?? 'default',
            customTemplateName: resumeData.customTemplateName ?? null,
            customTemplateVersion: resumeData.customTemplateVersion ?? null,
            templateSnapshot: resumeData.templateSnapshot ?? null,
            profile: JSON.stringify(resumeData.profile || {}),
            experiences: JSON.stringify(resumeData.experiences || []),
            educations: JSON.stringify(resumeData.educations || []),
            skills: JSON.stringify(resumeData.skills || []),
            customSections: JSON.stringify(resumeData.customSections || []),
            // Only persist styleConfig if provided — otherwise leave existing value
            ...(resumeData.styleConfig !== undefined
                ? { styleConfig: resumeData.styleConfig as unknown as Prisma.InputJsonValue }
                : {}),
        };

        if (!existing) {
            const created = await prisma.resume.create({
                data: { id: resumeId, userId: resumeData.userId, ...sharedFields } as Prisma.ResumeUncheckedCreateInput,
            });
            return NextResponse.json({
                data: formatResumeResponse(created as unknown as Record<string, unknown> & {
                    id: string;
                    title: string;
                    template: string;
                    profile: unknown;
                    experiences: unknown;
                    educations: unknown;
                    skills: unknown;
                    customSections: unknown;
                    updatedAt: Date;
                })
            }, { status: 200 });
        }

        const updated = await prisma.resume.update({
            where: { id: resumeId },
            data: sharedFields as Prisma.ResumeUncheckedUpdateInput,
        });

        return NextResponse.json({
            data: formatResumeResponse(updated as unknown as Record<string, unknown> & {
                id: string;
                title: string;
                template: string;
                profile: unknown;
                experiences: unknown;
                educations: unknown;
                skills: unknown;
                customSections: unknown;
                updatedAt: Date;
            })
        }, { status: 201 });
    } catch (err) {
        console.error(err);
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
        const existing = await prisma.resume.findFirst({ where: { id }, select: { id: true } });
        if (!existing) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }
        await prisma.resume.update({ where: { id: existing.id }, data: { deleted: true } });
        return NextResponse.json({ data: "Resume deleted successfully" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}
