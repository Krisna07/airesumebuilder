/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
// NOTE: `pdfdataextract` pulls in an ESM-only `pdfjs-dist` build which
// causes `ERR_REQUIRE_ESM` when required from a CommonJS environment on Vercel.
// To avoid that we dynamically import the library inside the request handler
// so the ESM module is loaded with `import()` instead of a static `require`.

const allowedOrigins = [
    'https://airesumebuilder-delta.vercel.app',
    'https://airesumebuilder.vercel.app',
];

function applyCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
    const origin = req.headers.origin;

    if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export const config = {
    api: {
        bodyParser: {
            // Increase JSON body size limit to allow base64 PDF uploads
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    applyCorsHeaders(req, res);

    // Diagnostic logging to help debug production routing/method issues
    try {
        console.log('extract-pdf: incoming method=', req.method);
        console.log('extract-pdf: origin=', req.headers.origin || null);
        console.log('extract-pdf: content-length=', req.headers['content-length'] || null);
    } catch (e) {
        console.error('extract-pdf: logging failed', e);
    }

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Allow GET for quick health checks and debugging in production
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'ok', message: 'extract-pdf route (pages API) is active' });
    }

    if (req.method !== 'POST') {
        console.warn('extract-pdf: method not allowed, received=', req.method);
        console.warn('extract-pdf: headers=', JSON.stringify(req.headers));
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { file } = req.body ?? {};

        try {
            const contentLength = req.headers['content-length'];
            if (contentLength) console.log('extract-pdf: content-length header =', contentLength);
        } catch (e) {
            console.error('extract-pdf: failed to log content-length header', e);
        }

        if (!file || typeof file !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid file data' });
        }

        const buffer = Buffer.from(file, 'base64');

        // Prefer `pdf-parse` (CommonJS) which works in the Node serverless runtime.
        try {
            const pdfParseMod = await import('pdf-parse');
            const pdfParse = (pdfParseMod as any).default ?? pdfParseMod;
            if (typeof pdfParse === 'function') {
                try {
                    const parsed: unknown = await (pdfParse as (buf: Buffer) => Promise<unknown>)(buffer as Buffer);
                    const parsedObj = parsed as { text?: string } | null;
                    return res.status(200).json({ text: parsedObj?.text ?? '', meta: parsed });
                } catch (pErr) {
                    console.warn('extract-pdf: pdf-parse parsing failed', pErr);
                    const message = pErr instanceof Error ? pErr.message : 'Invalid PDF or parsing error';
                    return res.status(400).json({ error: message });
                }
            }
        } catch (pErr) {
            console.error('extract-pdf: pdf-parse import failed; cannot parse PDFs on this deployment', pErr);
            return res.status(500).json({ error: 'PDF parser not available on server (pdf-parse import failed)' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed.';
        return res.status(500).json({ error: errorMessage });
    }
}
