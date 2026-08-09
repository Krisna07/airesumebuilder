import { AIService } from "@/services/aiServices";
import { AnalysisResult, JobDescription, ResumeData } from "@/types/types";
import { NextResponse } from "next/server";

import { prisma } from '@/lib/prisma'
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/services/subscriptionService'

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
    try{
        let userId: string
        try {
            ({ userId } = await requireUserSession())
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }
        try {
            await assertQuota(userId, 'cl')
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }
        const body = await req.json();
        const { resumeId, jobDescriptionId, analysis } = { ...body };
        console.log(resumeId, jobDescriptionId);
        //fetching job description id from request body
        const resume = resumeId ? await prisma.resume.findFirst({ where: { id: resumeId, deleted: false } }) : null;
        const jobDescriptionDetails = await prisma.jobDescription.findFirst({ where: { id: jobDescriptionId} }); 
        if(!resume || !jobDescriptionDetails){
            return NextResponse.json({ error: 'Resume data or Job Description is required' }, { status: 400 });
        }
        const reponse = await AIService.generateCoverLetter({
            id: resume?.id || '',
            userId: resume?.userId || '',
            title: resume?.title || '',
            template: resume?.template || '',
            profile: resume?.profile ? JSON.parse(resume.profile as string) : {},
            experiences: resume?.experiences ? JSON.parse(resume.experiences as string) : [],
            educations: resume?.educations ? JSON.parse(resume.educations as string) : [],
            skills: resume?.skills ? JSON.parse(resume.skills as string) : [],
            customSections: resume?.customSections ? JSON.parse(resume.customSections as string) : []
        } as ResumeData, jobDescriptionDetails as JobDescription, analysis as AnalysisResult);
        
        await consumeUsage(userId, 'cl')

        return NextResponse.json({
            data: reponse
        }, { status: 200 }
        );
    }catch(error){
        console.error('Generate Cover Letter API error:', error);
        return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
    }
}