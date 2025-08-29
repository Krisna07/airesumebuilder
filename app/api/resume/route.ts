// import { useAuth } from "@/context/authContext";

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient();
type Resume = {
    id?: string,
    userId: string,
    title: string,
    template?:string,
    profile: string,
    experiences: string,
    educations: string,
    skills: string,
    certificates: string,
}

export async function GET(req: NextRequest) {
    try {
        // For GET, use query params, not req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id') ?? undefined;
        console.log(`Fetching resume with id: ${id}`);
        const resume = await prisma.resume.findFirst({ where: { id } })
        if (!resume) {
            return NextResponse.json({
                status: 404,
                error: "Resume not found"
            });
        }
        // console.log(resume);
        return NextResponse.json({
            status: 200,
            data: {
               id:resume?.id, 
               title:resume?.title, 
               template:resume?.template, 
               profile: resume?.profile ? JSON.parse(resume.profile as string) : {},
               skills: resume?.skills ? JSON.parse(resume.skills as string) : [],
               experiences:resume?.experiences ? JSON.parse(resume.experiences as string) : [],
               educations:resume?.educations ? JSON.parse(resume.educations as string) : [],
               certificates:resume?.certificates ? JSON.parse(resume.certificates as string) : [],
               updated: resume?.updatedAt,
            }
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            error: (err instanceof Error ? err.message : 'Unknown error')
        });
    }
}


export async function PUT(req: NextRequest) {
    try {
        const resumeData: Resume = await req.json();
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
              certificates: JSON.stringify(resumeData.certificates || []),
        };
        const createdResume = await prisma.resume.create({ data: newResume });
         return NextResponse.json({
            status: 200,
             data: {
                    id: createdResume.id,
                    title: createdResume.title,
                    template: createdResume.template,
                    profile: typeof createdResume.profile === "string"  ? JSON.parse(createdResume.profile) : {},
                    experiences: typeof createdResume.experiences === "string"  ? JSON.parse(createdResume.experiences) : [],
                    educations: typeof createdResume.educations === "string"  ? JSON.parse(createdResume.educations) : [],
                    skills: typeof createdResume.skills === "string"  ? JSON.parse(createdResume.skills) : [],
                    certificates: typeof createdResume.certificates === "string"  ? JSON.parse(createdResume.certificates) : [],
                 updated: createdResume.updatedAt,
             },
        });
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
                certificates: JSON.stringify(resumeData.certificates),
            }
        });

        return NextResponse.json({
            status: 200,
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
                    certificates: typeof updatedResume.certificates === "string"  ? JSON.parse(updatedResume.certificates) : [],
                    updated: updatedResume.updatedAt,
                }
            }
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            error: (err instanceof Error ? err.message : 'Unknown error')
        });
    }
}