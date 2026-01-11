import type { NextApiRequest, NextApiResponse } from 'next';
import { extractText, getDocumentProxy } from 'unpdf';
const allowedOrigins = [
    'https://airesumebuilder-delta.vercel.app',
    'https://airesumebuilder.vercel.app',
    'https://airesumecraft.xyz/'
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
            // Match the size limit for base64 PDF uploads
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1. Setup CORS & Method Check
    applyCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { file } = req.body || {};
        if (!file) return res.status(400).json({ error: 'Missing file data' });

        // 2. Convert Base64 to Uint8Array (required for unpdf)
        const base64Data = file.includes('base64,') ? file.split('base64,')[1] : file;
        const buffer = Buffer.from(base64Data, 'base64');
        const uint8Array = new Uint8Array(buffer);

        // 3. Load and Extract
        const pdf = await getDocumentProxy(uint8Array);
        const { text, totalPages } = await extractText(pdf, { mergePages: true });

        // 4. Return the data
        return res.status(200).json({
            text: text,
            pages: totalPages,
            info: { message: "Extracted successfully" }
        });

    } catch (error) {
        console.error('Extraction Error:', error);
        return res.status(500).json({ error: 'Failed to parse PDF' });
    }
}