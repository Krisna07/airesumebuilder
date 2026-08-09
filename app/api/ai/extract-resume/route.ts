import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/services/subscriptionService'
import { extractResumeFromText, cleanResumeText } from '@/services/textResumeExtractor'

export const runtime = 'nodejs';
export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const handle = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
        promise
            .then((value) => {
                clearTimeout(handle);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(handle);
                reject(error);
            });
    });
}

export async function POST(req: NextRequest) {
    try {
        let userId: string
        try {
            ({ userId } = await requireUserSession())
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }
        try {
            await assertQuota(userId, 'upload')
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }
        const body = await req.json();
        const rawText = typeof body?.text === 'string' ? body.text : '';
        const text = rawText.trim();
        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // Guard against unusually large payloads that can degrade model calls.
        const MAX_TEXT_CHARS = 22000;
        const boundedText = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
        const extractionTimeoutMs = 22000;

        let structuredData
        try {
            console.log('[Resume Extract] Attempting fast AI extraction...');
            structuredData = await withTimeout(
                AIService.extractResumeFast(boundedText),
                extractionTimeoutMs,
                'Resume extraction AI call'
            );
        } catch (aiError) {
            console.warn('[Resume Extract] AI extraction failed, using advanced pattern-based extractor:', aiError)
            // Use the advanced pattern-based extractor (textResumeExtractor) instead of basic fallback
            try {
                const cleanedText = cleanResumeText(boundedText);
                structuredData = extractResumeFromText(cleanedText, userId, 'Imported Resume');
                console.log('[Resume Extract] Successfully extracted using advanced extractor');
            } catch (extractError) {
                console.error('[Resume Extract] Advanced extractor also failed:', extractError);
                return NextResponse.json({ 
                    error: 'Failed to extract resume', 
                    details: 'Could not parse resume format. Please ensure your resume has clear sections.',
                    retryHint: 'Try uploading a resume with clear section headers (Experience, Education, Skills, etc.)'
                }, { status: 400 });
            }
        }

        if (!structuredData) {
            return NextResponse.json({ error: 'Failed to process resume data' }, { status: 500 });
        }
        try {
            await consumeUsage(userId, 'upload')
        } catch (usageError) {
            console.warn('Failed to record upload usage after successful resume extraction:', usageError)
        }
        return NextResponse.json({
            status: 200,
            message: 'Resume data extracted successfully',
            data: structuredData,
        });

    } catch (error) {
        console.error('Error in extract-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        const retryMatch = typeof message === 'string' && message.match(/Retry after\s*(\d+s|\d+\.\d+s)/i);
        const retryHint = retryMatch ? `Retry after ${retryMatch[1]}.` : undefined;
        return NextResponse.json({ error: 'Failed to extract resume', details: message, retryHint }, { status: 500 });
    }
}

export async function GET() {
    try {
        return NextResponse.json({
            status: 200,
            message: 'ednpoint hit succfully'
        })

    } catch (error) {
        console.error('Error in resume-extraction:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to parse request body', details: message }, { status: 500 });
    }
}
