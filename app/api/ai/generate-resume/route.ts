import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AnalysisResult, ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

function normalizeJobDescriptionInput(input: unknown): string | undefined {
    if (typeof input === 'string') {
        const trimmed = input.trim();
        return trimmed.length ? trimmed : undefined;
    }

    if (input && typeof input === 'object') {
        const candidate = input as Record<string, unknown>;
        const parts = [
            candidate.title,
            candidate.company,
            candidate.location,
            candidate.description,
            candidate.requirements,
            candidate.responsibilities,
            candidate.rawText,
            candidate.text,
            candidate.content,
        ]
            .flatMap((value) => {
                if (typeof value === 'string') return [value];
                if (Array.isArray(value)) {
                    return value.filter((item): item is string => typeof item === 'string');
                }
                return [];
            })
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length) {
            return parts.join('\n\n');
        }

        try {
            return JSON.stringify(input);
        } catch {
            return undefined;
        }
    }

    return undefined;
}

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

        const {
            resume,
            jobDescription,
            analysis,
            customPrompt,
        }: {
            resume: ResumeData,
            jobDescription?: unknown,
            analysis?: AnalysisResult,
            customPrompt?: string
        } = await req.json();

        if (!resume) {
            return NextResponse.json({ error: 'Missing resume data' }, { status: 400 });
        }

        // Generate full resume (synchronous, 60s timeout)
        const normalizedJobDescription = normalizeJobDescriptionInput(jobDescription);
        const generatedResume = await AIService.generateResume(
            resume,
            undefined,
            normalizedJobDescription,
            customPrompt,
            analysis,
        );

        if (!generatedResume) {
            return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
        }

        if (userId) {
            const { consumeUsage } = await import('@/lib/subscription-server')
            await consumeUsage(userId, 'regen')
        } else {
            await consumeGuestUsage('regen')
        }

        return NextResponse.json({
            success: true,
            resume: generatedResume
        });

    } catch (error) {
        console.error('Error in generate-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to process request', details: message }, { status: 500 });
    }
}
