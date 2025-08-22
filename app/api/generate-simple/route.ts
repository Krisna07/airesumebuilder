import { NextRequest } from "next/server";
import { generateTemplateHTML } from "../../../lib/template-utils";

import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📄 Simple PDF Generation Request');

        let content = body?.content;

        // If resumeData and template are provided, generate HTML from template
        if (body.resumeData && body.template) {
            content = generateTemplateHTML(body.template, body.resumeData);
            console.log('✅ HTML generated from template');
        }

        if (!content) {
            throw new Error('No content provided');
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(content, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm',
            }
        });

        await browser.close();
        console.log('✅ PDF generated successfully');

        // Generate filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        // Use ArrayBuffer for Response body
        const arrayBuffer = pdfBuffer instanceof Buffer
            ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
            : pdfBuffer.buffer;
        return new Response(arrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        return new Response(JSON.stringify({
            error: 'PDF generation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}