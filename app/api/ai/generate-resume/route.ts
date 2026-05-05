import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

        // Logged-in users: queue a durable background regeneration so work survives navigation/browser close.
        if (userId) {
            if (!resume?.id || typeof resume.id !== 'string') {
                return NextResponse.json({ error: 'Missing resume id for regeneration' }, { status: 400 });
            }

            const ownedResume = await prisma.resume.findFirst({
                where: { id: resume.id, userId, deleted: false },
                select: { id: true },
            });

            if (!ownedResume) {
                return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
            }

            await prisma.resume.update({
                where: { id: ownedResume.id },
                data: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenStatus: 'pending',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenRequestedAt: new Date(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenStartedAt: null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenFinishedAt: null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenError: null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new fields until prisma client regenerated
                    regenJobDescription: (jobDescription ?? null) as unknown as any,
                } as any,
            });

            return NextResponse.json({
                success: true,
                queued: true,
                resumeId: ownedResume.id,
                message: 'Regeneration queued',
            }, { status: 202 });
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

function safeParseJson<T>(value: unknown, fallback: T): T {
    if (value == null) return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const userId = typeof token?.id === 'string'
            ? token.id
            : typeof token?.sub === 'string'
                ? token.sub
                : null;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get('resumeId') ?? '';

        if (!resumeId) {
            return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
        }

        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId, deleted: false },
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const statusRaw = (resume as any).regenStatus as string | undefined;
        const status = statusRaw || 'idle';
        const response: Record<string, unknown> = {
            status,
            error: (resume as any).regenError || null,
            updatedAt: resume.updatedAt,
        };

        if (status === 'completed') {
            response.resume = {
                id: resume.id,
                userId: resume.userId,
                title: resume.title,
                template: resume.template,
                profile: safeParseJson(resume.profile, {}),
                experiences: safeParseJson(resume.experiences, []),
                educations: safeParseJson(resume.educations, []),
                skills: safeParseJson(resume.skills, []),
                customSections: safeParseJson(resume.customSections, []),
                styleConfig: safeParseJson((resume as any).styleConfig, null),
            };
        }

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error('Error in generate-resume status route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to fetch regeneration status', details: message }, { status: 500 });
    }
}
