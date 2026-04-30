import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        const userId = typeof token?.id === 'string'
            ? token.id
            : typeof token?.sub === 'string'
                ? token.sub
                : null

        try {
            if (userId) {
                const { assertQuota, mapSubscriptionError } = await import('@/lib/subscription-server')
                try {
                    await assertQuota(userId, 'regen')
                } catch (err) {
                    const mapped = mapSubscriptionError(err)
                    return NextResponse.json({ error: mapped.message }, { status: mapped.status })
                }
            } else {
                await assertGuestQuota('regen')
            }
        } catch (err) {
            const mapped = mapGuestUsageError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        const { resume, jobDescription }: { resume: ResumeData, jobDescription: string } = await req.json();

        if (!resume) {
            return NextResponse.json({ error: 'Missing resume data or job description' }, { status: 400 });
        }

        const generatedResume = await AIService.generateResume(resume, undefined, jobDescription);

        if (!generatedResume) {
            return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
        }

        if (userId) {
            const { consumeUsage } = await import('@/lib/subscription-server')
            await consumeUsage(userId, 'regen')
        } else {
            await consumeGuestUsage('regen')
        }
        return NextResponse.json({ resume: generatedResume });

    } catch (error) {
        console.error('Error in generate-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to process request', details: message }, { status: 500 });
    }
}
