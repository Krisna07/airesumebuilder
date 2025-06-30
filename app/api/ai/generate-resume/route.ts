import { NextRequest, NextResponse } from 'next/server';
import { GenerateResume } from '@/lib/ai-actions';
import { Resume } from '@/types/Resume';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { resume, jobDescription }: { resume: Resume, jobDescription: string } = await req.json();

        if (!resume || !jobDescription) {
            return NextResponse.json({ error: 'Missing resume data or job description' }, { status: 400 });
        }

        const generatedResume = await GenerateResume(resume, undefined, jobDescription);

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
