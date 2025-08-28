import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient();
export async function GET(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({
                status: 400,
                error: "Missing 'id' parameter"
            });
        }
        const allResumes = await prisma.resume.findMany({ where: { userId: id } });
        allResumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        if (allResumes.length) {
            return NextResponse.json({
                status: 200,
                data: allResumes.map(resume => ({
                    id: resume.id,
                    title: resume.title,
                    template: resume.template,
                    updatedAt: resume.updatedAt
                })),
                message: "Resumes fetched successfully"
            });
        } else {
            return NextResponse.json({
                status: 404,
                data: [],
                message: "No resumes found"
            });
        }

    } catch (err) {
        return NextResponse.json({
            status: 500,
            error: err,
            message: 'Internal server error'
        })

    }
}