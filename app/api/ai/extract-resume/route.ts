import { NextRequest, NextResponse } from 'next/server';
import { GenerateResume } from '@/lib/ai-actions';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // Call the AI function to process the text
        const structuredData = await GenerateResume(undefined, text);

        if (!structuredData) {

            return NextResponse.json({ error: 'Failed to process resume data' }, { status: 500 });
        }
        console.log('Structured Data:', structuredData);
        return NextResponse.json({ data: structuredData });

    } catch (error) {
        console.error('Error in extract-resume route:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to parse request body', details: message }, { status: 500 });
    }
}
