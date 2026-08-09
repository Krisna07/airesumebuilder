import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BASE64_CHARS = 14_000_000; // ~10 MB decoded

export async function POST(req: NextRequest): Promise<NextResponse> {
    const body = await req.json().catch(() => null);
    const base64 = typeof body?.file === 'string' ? body.file : '';

    if (!base64) {
        return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }
    if (base64.length > MAX_BASE64_CHARS) {
        return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const buffer = Buffer.from(base64, 'base64');
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = Array.isArray(pages) ? pages.join('\n') : String(pages ?? '');

    if (!text.trim()) {
        return NextResponse.json(
            { error: 'No extractable text found in PDF. If this is a scanned or image-based PDF, try exporting a text-based version.' },
            { status: 422 }
        );
    }

    return NextResponse.json({ text });
}
