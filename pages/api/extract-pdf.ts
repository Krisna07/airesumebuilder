import type { NextApiRequest, NextApiResponse } from 'next';
import { PdfData } from 'pdfdataextract';

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

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
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
        const data = await PdfData.extract(buffer);

        return res.status(200).json({
            text: (data.text ?? []).join('\n'),
            meta: data,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed.';
        return res.status(500).json({ error: errorMessage });
    }
}
