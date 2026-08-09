import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { requireUserSession, mapSubscriptionError } from '@/services/subscriptionService'

function safeParseJson<T>(value: unknown, fallback: T): T {
    if (value == null) return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

export async function GET(req: NextRequest) {

    try {
        let sessionUserId: string
        try {
            ;({ userId: sessionUserId } = await requireUserSession())
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }
        if (id !== sessionUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const allResumes = await prisma.resume.findMany({ where: { userId: sessionUserId } });
        if (!allResumes) {
            return NextResponse.json({ error: "No resumes found" }, { status: 404 });
        }
        const activeResumes = allResumes && allResumes.filter(resume => !resume.deleted);
        activeResumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        return NextResponse.json({
            data: activeResumes.map(resume => ({
                id: resume.id,
                title: resume.title,
                template: resume.template,
                customTemplateName: (resume as Record<string, unknown>).customTemplateName ?? null,
                customTemplateVersion: (resume as Record<string, unknown>).customTemplateVersion ?? null,
                templateSnapshot: safeParseJson((resume as Record<string, unknown>).templateSnapshot, null),
                profile: safeParseJson(resume.profile, {}),
                skills: safeParseJson(resume.skills, []),
                experiences: safeParseJson(resume.experiences, []),
                educations: safeParseJson(resume.educations, []),
                customSections: safeParseJson(resume.customSections, []),
                styleConfig: safeParseJson((resume as Record<string, unknown>).styleConfig, null),
                updated: resume.updatedAt,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                matchingScore: (resume as any).matchingScore ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                analyzedAt: (resume as any).analyzedAt ?? null,
            }))
        }, { status: 200 });
    }
    catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
