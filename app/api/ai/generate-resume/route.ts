import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AnalysisResult, ResumeData } from '@/types/types';
import { AIService } from '@/services/aiServices';
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isBlockingQuotaStatus(status: number): boolean {
    return status === 401 || status === 403;
}

function getJwtSecret(): string | undefined {
    return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
}

async function resolveAuthenticatedUserId(req: NextRequest): Promise<string | null> {
    const token = await getToken({ req, secret: getJwtSecret() })
    const tokenId = typeof token?.id === 'string' ? token.id.trim() : ''
    const email = typeof token?.email === 'string' ? token.email.trim().toLowerCase() : ''

    // Validate token.id against the app User table because some OAuth JWTs can carry provider ids.
    if (tokenId) {
        try {
            const userById = await prisma.user.findUnique({ where: { id: tokenId }, select: { id: true } })
            if (userById?.id) {
                return userById.id
            }

            if (email) {
                const userByEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } })
                if (userByEmail?.id) {
                    console.warn('generate-resume recovered user id from email fallback for token id:', tokenId)
                    return userByEmail.id
                }
            }

            console.warn('generate-resume token id did not map to a user:', tokenId)
            return null
        } catch (err) {
            console.error('generate-resume failed while validating token user id:', err)
        }
    }

    // Do not trust token.sub for app user id. On OAuth sessions it can be provider account id.
    if (!email) return null

    try {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
        return user?.id ?? null
    } catch (err) {
        console.error('generate-resume failed to resolve user id by email:', err)
        return null
    }
}

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
        const userId = await resolveAuthenticatedUserId(req)

        try {
            if (userId) {
                const { assertQuota, mapSubscriptionError } = await import('@/lib/subscription-server')
                try {
                    await assertQuota(userId, 'regen')
                } catch (err) {
                    const mapped = mapSubscriptionError(err)
                    if (isBlockingQuotaStatus(mapped.status)) {
                        return NextResponse.json({ error: mapped.message }, { status: mapped.status })
                    }
                    console.error('generate-resume quota precheck failed (non-blocking):', err)
                }
            } else {
                try {
                    await assertGuestQuota('regen')
                } catch (err) {
                    const mapped = mapGuestUsageError(err)
                    if (isBlockingQuotaStatus(mapped.status)) {
                        return NextResponse.json({ error: mapped.message }, { status: mapped.status })
                    }
                    console.error('generate-resume guest quota precheck failed (non-blocking):', err)
                }
            }
        } catch (err) {
            console.error('generate-resume quota module failed to initialize (non-blocking):', err)
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
            try {
                await consumeUsage(userId, 'regen')
            } catch (err) {
                console.error('generate-resume usage consume failed (non-blocking):', err)
            }
        } else {
            try {
                await consumeGuestUsage('regen')
            } catch (err) {
                console.error('generate-resume guest usage consume failed (non-blocking):', err)
            }
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
