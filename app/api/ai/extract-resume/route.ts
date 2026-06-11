import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/lib/subscription-server'

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;
        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        let userId: string | undefined;
        let isAuthenticated = false;

        try {
            ({ userId } = await requireUserSession());
            isAuthenticated = true;
        } catch (err) {
            userId = undefined;
        }

        if (isAuthenticated && userId) {
            try {
                await assertQuota(userId, 'upload')
            } catch (err) {
                const mapped = mapSubscriptionError(err)
                return NextResponse.json({ error: mapped.message }, { status: mapped.status })
            }
        }

        const structuredData = await AIService.generateResume(undefined, text);

        if (!structuredData) {
            return NextResponse.json({ error: 'Failed to process resume data' }, { status: 500 });
        }

        if (isAuthenticated && userId) {
            await consumeUsage(userId, 'upload')
        }

        return NextResponse.json({
            status: 200,
            message: isAuthenticated ? 'Resume data extracted successfully' : 'Guest resume data extracted successfully',
            data: structuredData,
        });

    } catch (error) {
        console.error('Error in extract-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        const retryMatch = typeof message === 'string' && message.match(/Retry after\s*(\d+s|\d+\.\d+s)/i);
        const retryHint = retryMatch ? `Retry after ${retryMatch[1]}.` : undefined;
        return NextResponse.json({ error: 'Failed to parse request body', details: message, retryHint }, { status: 500 });
    }
}

export async function GET() {
    try {
        return NextResponse.json({
            status: 200,
            message: 'Endpoint hit successfully'
        })

    } catch (error) {
        console.error('Error in resume-extraction:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to parse request body', details: message }, { status: 500 });
    }
}
