import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';

export async function POST(req: NextRequest) {
    try {

        const { resume, jobDescription }: { resume: ResumeData, jobDescription: string } = await req.json();

        if (!resume) {
            return NextResponse.json({ error: 'Missing resume data or job description' }, { status: 400 });
        }

        const generatedResume = await AIService.generateResume(resume, undefined, jobDescription);

        if (!generatedResume) {
            return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
        }

        return NextResponse.json({ resume: generatedResume });

    } catch (error) {
        console.error('Error in generate-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to process request', details: message }, { status: 500 });
    }
}
