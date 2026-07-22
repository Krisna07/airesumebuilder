import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
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

/**
 * Extract Resume (Guest) - PUBLIC API (No authentication required)
 * POST /api/ai/extract-resume-guest
 * 
 * Request body:
 * {
 *   "text": "raw resume text"
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const rawText = typeof body?.text === 'string' ? body.text : '';
        const text = rawText.trim();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const MAX_TEXT_CHARS = 35000;
        const boundedText = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
        const extractionTimeoutMs = Math.max(Number(process.env.RESUME_EXTRACTION_TIMEOUT_MS || 22000), 5000);

        let structuredData
        try {
            console.log('[Guest Resume Extract] Attempting fast AI extraction...');
            structuredData = await withTimeout(
                AIService.extractResumeFast(boundedText),
                extractionTimeoutMs,
                'Guest resume extraction AI call'
            );
        } catch (aiError) {
            console.warn('[Guest Resume Extract] AI extraction failed, using advanced pattern-based extractor:', aiError)
            // Use the advanced pattern-based extractor instead of basic fallback
            try {
                const cleanedText = cleanResumeText(boundedText);
                structuredData = extractResumeFromText(cleanedText, 'guest', 'Imported Resume');
                console.log('[Guest Resume Extract] Successfully extracted using advanced extractor');
            } catch (extractError) {
                console.error('[Guest Resume Extract] Advanced extractor also failed:', extractError);
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

        return NextResponse.json({
            status: 200,
            message: 'Guest resume data extracted successfully',
            data: structuredData,
        });
    } catch (error) {
        console.error('Error in extract-resume-guest route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        const retryMatch = typeof message === 'string' && message.match(/Retry after\s*(\d+s|\d+\.\d+s)/i);
        const retryHint = retryMatch ? `Retry after ${retryMatch[1]}.` : undefined;
        return NextResponse.json({ error: 'Failed to parse request body', details: message, retryHint }, { status: 500 });
    }
}
