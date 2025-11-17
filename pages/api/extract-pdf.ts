import type { NextApiRequest, NextApiResponse } from 'next';
import { PdfData } from 'pdfdataextract';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { file } = req.body;
        if (!file || typeof file !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid file data' });
        }
        const buffer = Buffer.from(file, 'base64');
        const data = await PdfData.extract(buffer);
        res.status(200).json({ text: (data.text ?? []).join('\n'), meta: data });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed.';
        res.status(500).json({ error: errorMessage });
    }
}
