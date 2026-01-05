import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
      const results: Record<string, unknown> = {};

    // Test pdf-parse
    try {
      const mod = await import('pdf-parse');
        const pdfParse = (mod as unknown) as { default?: unknown };
        const typeDesc = typeof ((pdfParse as { default?: unknown }).default ?? pdfParse);
        results['pdf-parse'] = { ok: true, type: typeDesc };
    } catch (err) {
      results['pdf-parse'] = { ok: false, error: String(err) };
    }

    // Test pdfdataextract
    try {
        await import('pdfdataextract');
      results['pdfdataextract'] = { ok: true };
    } catch (err) {
      results['pdfdataextract'] = { ok: false, error: String(err) };
    }

    return res.status(200).json({ status: 'ok', results });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
