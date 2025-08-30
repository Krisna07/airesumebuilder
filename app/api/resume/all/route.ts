import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient();
export async function GET(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }
        const allResumes = await prisma.resume.findMany({ where: { userId: id } });
        const activeResumes = allResumes.filter(resume => !resume.deleted);
        activeResumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

            return NextResponse.json({
                data: activeResumes.map(resume => ({
                    id: resume.id,
                    title: resume.title,
                    template: resume.template,
                    updatedAt: resume.updatedAt
                }))
            }, { status: 200 });
        }
    catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });

    }
}