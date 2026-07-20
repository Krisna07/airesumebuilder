import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
import { buildResumeFallback } from '@/lib/resumeTextFallback'

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const rawText = typeof body?.text === 'string' ? body.text : '';
        const text = rawText.trim();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const MAX_TEXT_CHARS = 50000;
        const boundedText = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;

        let structuredData
        try {
            structuredData = await AIService.generateResume(undefined, boundedText);
        } catch (aiError) {
            console.warn('Guest AI resume extraction failed, falling back to heuristic parser:', aiError)
            structuredData = buildResumeFallback(boundedText)
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
