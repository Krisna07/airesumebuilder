// Ensure this API route runs in Node.js, not Edge
// export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const isProd = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📄 PDF Generation Request:', {
            hasResumeData: !!body.resumeData,
            template: body.template,
            hasContent: !!body.content
        });

        let content = body.content;

        // If resumeData and template are provided, generate HTML from template
        if (body.resumeData && body.template) {
            try {
                content = generateTemplateHTML(body.template, body.resumeData);
                console.log('✅ HTML generated from template, length:', content.length);
            } catch (htmlError) {
                console.error('❌ HTML generation error:', htmlError);
                throw new Error(`HTML generation failed: ${htmlError instanceof Error ? htmlError.message : 'Unknown error'}`);
            }
        }

        if (!content) {
            throw new Error('No content provided for PDF generation');
        }

        console.log('🚀 Launching browser...');
        let executablePath;
        if (isProd) {
            executablePath = await chromium.executablePath();
        } else {
            // Use Puppeteer's own Chromium in dev
            const puppeteerPkg = await import('puppeteer');
            executablePath = puppeteerPkg.executablePath();
        }

        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath,
            headless: true,
        });

        console.log('📄 Creating new page...');
        const page = await browser.newPage();
        await page.setContent(content, { waitUntil: 'load' });

        console.log('🖨️ Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm',
            },
            preferCSSPageSize: false,
            displayHeaderFooter: false,
        });

        await browser.close();
        console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

        // Generate filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        // Return PDF as response
        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return new Response(JSON.stringify({
            error: 'PDF generation failed',
            details: errorMessage,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}