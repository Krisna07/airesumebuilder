/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";

// Vercel Settings: Chromium takes ~2-4s to download and launch.
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    let browser = null;

    try {
        const body = await req.json();
        let content = body.content;

        // 1. Generate HTML if template data is provided
        if (body.resumeData && body.template) {
            try {
                content = generateTemplateHTML(body.template, body.resumeData);
            } catch (htmlError: any) {
                throw new Error(`HTML generation failed: ${htmlError.message}`);
            }
        }

        if (!content) throw new Error('No content provided for PDF generation');

        // 2. Determine Environment
        const isProd = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;

        const viewport = {
            deviceScaleFactor: 1,
            hasTouch: false,
            height: 1080,
            isLandscape: true,
            isMobile: false,
            width: 1920,
        };

        // 3. Launch Browser (dynamic imports avoid bundling heavy binaries unnecessarily)
        if (isProd) {
            const puppeteer = await import('puppeteer-core');
            const chromium = (await import('@sparticuz/chromium')).default;

            browser = await puppeteer.launch({
                args: puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
                defaultViewport: viewport,
                executablePath: await chromium.executablePath(),
                headless: 'shell',
            });
        } else {
            const puppeteer = await import('puppeteer');
            const executablePath = typeof puppeteer.executablePath === 'function'
                ? await puppeteer.executablePath()
                : puppeteer.executablePath;

            browser = await puppeteer.launch({
                args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions'],
                defaultViewport: viewport,
                executablePath,
                headless: true,
            });
        }

        // 4. Create page
        const page = await browser.newPage();
        
        // Use 'networkidle0' to ensure all CSS/Images are loaded before PDFing
        await page.setContent(content, { waitUntil: 'networkidle0' });

        // 5. PDF Configuration
        const pageGap = body.pageGap || {
            top: '4mm',
            bottom: '4mm',
            left: '10mm',
            right: '10mm',
        };

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: pageGap,
            preferCSSPageSize: false,
        });

        // 6. Cleanup
        await browser.close();

        // 7. Prepare Filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        // 8. Return PDF Response
        const pdfArrayBuffer = Uint8Array.from(pdfBuffer).buffer;

        return new NextResponse(pdfArrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error('❌ PDF Generation Error:', error);
        
        if (browser) await (browser as any).close();

        return NextResponse.json({
            error: 'PDF generation failed',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
