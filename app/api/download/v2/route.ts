/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";

// Vercel Settings: Chromium takes ~2-4s to download and launch.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const chromiumVersion = process.env.CHROMIUM_VERSION || '141.0.0';
const chromiumArch = process.arch === 'arm64' ? 'arm64' : 'x64';
const remotePackUrl = `https://github.com/Sparticuz/chromium/releases/download/v${chromiumVersion}/chromium-v${chromiumVersion}-pack.${chromiumArch}.tar`;

export async function POST(req: NextRequest) {
    let browser: any = null;

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

        // Match the preview component's PAGE_WIDTH_PX (794) and PAGE_HEIGHT_PX (1123)
        const viewport = { width: 794, height: 1123 };

        // 3. Launch Browser via Playwright
        if (isProd) {
            // Production: use playwright-core with @sparticuz/chromium binary
            const { chromium } = await import('playwright-core');
            const chromiumBin = (await import('@sparticuz/chromium')).default;
            browser = await chromium.launch({
                args: chromiumBin.args,
                executablePath: await chromiumBin.executablePath(remotePackUrl),
                headless: true,
            });
        } else {
            // Local dev: use full playwright with its own Chromium
            const { chromium } = await import('playwright');
            browser = await chromium.launch({
                args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions'],
                headless: true,
            });
        }

        // 4. Create context + page
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();

        // Use 'networkidle' (Playwright equivalent of Puppeteer's 'networkidle0')
        await page.setContent(content, { waitUntil: 'networkidle' });

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
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error('❌ PDF v2 Download Error:', error);

        if (browser) await browser.close().catch(() => { });

        return NextResponse.json({
            error: 'PDF generation failed',
            details: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
