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
        const playwrightViewport = { width: 794, height: 1123 };
        const puppeteerViewport = {
            deviceScaleFactor: 1,
            hasTouch: false,
            height: 1123,
            isLandscape: false,
            isMobile: false,
            width: 794,
        };

        // 3. PDF margin config
        const pageGap = body.pageGap || {
            top: '4mm',
            bottom: '4mm',
            left: '10mm',
            right: '10mm',
        };

        let pdfBuffer!: Buffer;

        // ── Playwright (primary) ──────────────────────────────────────────────
        try {
            let pwBrowser: any;
            if (isProd) {
                const { chromium } = await import('playwright-core');
                const chromiumBin = (await import('@sparticuz/chromium')).default;
                pwBrowser = await chromium.launch({
                    args: chromiumBin.args,
                    executablePath: await chromiumBin.executablePath(remotePackUrl),
                    headless: true,
                });
            } else {
                const { chromium } = await import('playwright');
                pwBrowser = await chromium.launch({
                    args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions'],
                    headless: true,
                });
            }
            const ctx = await pwBrowser.newContext({ viewport: playwrightViewport });
            const pwPage = await ctx.newPage();
            await pwPage.setContent(content, { waitUntil: 'networkidle' });
            pdfBuffer = await pwPage.pdf({
                format: 'A4',
                printBackground: true,
                margin: pageGap,
                preferCSSPageSize: false,
            });
            await pwBrowser.close();
            console.log('[pdf] playwright success');
        } catch (playwrightError) {
            console.warn('[pdf] playwright failed, falling back to puppeteer:', playwrightError instanceof Error ? playwrightError.message : playwrightError);

            // ── Puppeteer (fallback) ──────────────────────────────────────────
            let puppeteerBrowser: any;
            try {
                if (isProd) {
                    const puppeteer = await import('puppeteer-core');
                    const chromiumBin = (await import('@sparticuz/chromium')).default;
                    puppeteerBrowser = await puppeteer.launch({
                        args: puppeteer.defaultArgs({ args: chromiumBin.args, headless: 'shell' }),
                        defaultViewport: puppeteerViewport,
                        executablePath: await chromiumBin.executablePath(remotePackUrl),
                        headless: 'shell',
                    });
                } else {
                    const puppeteer = await import('puppeteer');
                    const executablePath = typeof puppeteer.executablePath === 'function'
                        ? await puppeteer.executablePath()
                        : puppeteer.executablePath;
                    puppeteerBrowser = await puppeteer.launch({
                        args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions'],
                        defaultViewport: puppeteerViewport,
                        executablePath,
                        headless: true,
                    });
                }
                const page = await puppeteerBrowser.newPage();
                await page.setContent(content, { waitUntil: 'networkidle0' });
                pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: pageGap,
                    preferCSSPageSize: false,
                });
                await puppeteerBrowser.close();
                console.log('[pdf] puppeteer fallback success');
            } catch (puppeteerError) {
                if (puppeteerBrowser) await puppeteerBrowser.close().catch(() => { });
                throw puppeteerError;
            }
        }

        // 7. Prepare Filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        // 8. Return PDF Response
        return new NextResponse(Uint8Array.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error('❌ PDF Generation Error:', error);

        return NextResponse.json({
            error: 'PDF generation failed',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
