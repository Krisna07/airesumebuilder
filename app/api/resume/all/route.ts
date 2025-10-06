import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient();
export async function GET(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);

        const id = searchParams.get('id');
        console.log("Fetching resumes for user ID:", id);
        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }
        const allResumes = await prisma.resume.findMany({ where: { userId: id } });
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
                    profile: resume.profile ? JSON.parse(resume.profile as string) : {},
                    skills: resume.skills ? JSON.parse(resume.skills as string) : [],
                    experiences: resume.experiences ? JSON.parse(resume.experiences as string) : [],
                    educations: resume.educations ? JSON.parse(resume.educations as string) : [],
                    certificates: resume.certificates ? JSON.parse(resume.certificates as string) : [],
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