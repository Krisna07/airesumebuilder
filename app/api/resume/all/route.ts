import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'

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
        const { searchParams } = new URL(req.url);

        const id = searchParams.get('id');
        console.log("Fetching resumes for user ID:", id);
        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }
        const activeResumes = await prisma.resume.findMany({
            where: { userId: id, deleted: false },
            orderBy: { updatedAt: 'desc' }
        });
        if (!activeResumes || activeResumes.length === 0) {
            return NextResponse.json({ error: "No resumes found" }, { status: 404 });
        }

        return NextResponse.json({
            data: activeResumes.map(resume => ({
                id: resume.id,
                title: resume.title,
                template: resume.template,
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
