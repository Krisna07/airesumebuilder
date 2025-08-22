import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET() {
    try {
        const testHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Test PDF</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333; }
                    p { line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>Test PDF Generation</h1>
                <p>This is a test PDF to verify that the PDF generation is working correctly.</p>
                <p>If you can see this PDF, the Puppeteer setup is working properly.</p>
                <p>Generated at: ${new Date().toLocaleString()}</p>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-extensions',
            ]
        });

        const page = await browser.newPage();
        await page.setContent(testHTML, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm',
            },
        });

        await browser.close();

        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="test.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Test PDF generation failed:', error);
        return NextResponse.json({
            error: 'Test PDF generation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
