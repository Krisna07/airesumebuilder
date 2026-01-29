import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/lib/subscription-server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
    try {

        let userId: string
        try {
            ({ userId } = await requireUserSession())
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        const rl = checkRateLimit({ key: `user:${userId}:ai:generate-resume`, windowMs: 60_000, max: 10 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        }
        try {
            await assertQuota(userId, 'regen')
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        const { resume, jobDescription }: { resume: ResumeData, jobDescription: string } = await req.json();

        if (!resume) {
            return NextResponse.json({ error: 'Missing resume data or job description' }, { status: 400 });
        }
        if (jobDescription && typeof jobDescription === 'string' && jobDescription.length > 120_000) {
            return NextResponse.json({ error: 'Job description too large' }, { status: 413 });
        }

        const generatedResume = await AIService.generateResume(resume, undefined, jobDescription);

        if (!generatedResume) {
            return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
        }

        await consumeUsage(userId, 'regen')
        return NextResponse.json({ resume: generatedResume });

    } catch (error) {
        console.error('Error in generate-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to process request', details: message }, { status: 500 });
    }
}
