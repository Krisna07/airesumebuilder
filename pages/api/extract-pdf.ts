import type { NextApiRequest, NextApiResponse } from 'next';
import { PdfData } from 'pdfdataextract';

export const config = {
    api: {
        bodyParser: {
            // Increase JSON body size limit to allow base64 PDF uploads
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { file } = req.body;
        // Helpful debug logging for large uploads
        try {
            const contentLength = req.headers['content-length'];
            if (contentLength) console.log('extract-pdf: content-length header =', contentLength);
        } catch (e) {
            // ignore logging errors — don't fail the request for logging issues
        }
        if (!file || typeof file !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid file data' });
        }
        const buffer = Buffer.from(file, 'base64');
        const data = await PdfData.extract(buffer);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ text: (data.text ?? []).join('\n'), meta: data });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed.';
        res.status(500).json({ error: errorMessage });
    }
}
