/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getToken } from 'next-auth/jwt';
import { generateTemplateHTML } from "@/lib/template-utils";
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';
// Dynamic imports for puppeteer and chromium
import fs from 'fs';

// Force Node.js runtime for this route (not edge)
export const runtime = "nodejs";

const isProd = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;
const chromiumVersion = process.env.CHROMIUM_VERSION || '141.0.0';
const chromiumArch = process.arch === 'arm64' ? 'arm64' : 'x64';
const remotePackUrl = `https://github.com/Sparticuz/chromium/releases/download/v${chromiumVersion}/chromium-v${chromiumVersion}-pack.${chromiumArch}.tar`;

function jsonError(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let content = body.content;
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const userId = typeof token?.id === 'string'
            ? token.id
            : typeof token?.sub === 'string'
                ? token.sub
                : null;

        // If resumeData and template are provided, generate HTML from template
        if (body.resumeData && body.template) {
            try {
                content = generateTemplateHTML(body.template, body.resumeData);
            } catch (htmlError) {
                console.error('❌ HTML generation error:', htmlError);
                throw new Error(`HTML generation failed: ${htmlError instanceof Error ? htmlError.message : 'Unknown error'}`);
            }
        }

        if (!content) {
            throw new Error('No content provided for PDF generation');
        }

        try {
            if (userId) {
                const { assertQuota, mapSubscriptionError } = await import('@/lib/subscription-server');
                try {
                    await assertQuota(userId, 'download');
                } catch (err) {
                    const mapped = mapSubscriptionError(err);
                    return jsonError(mapped.status, { error: mapped.message });
                }
            } else {
                await assertGuestQuota('download');
            }
        } catch (err) {
            const mapped = mapGuestUsageError(err);
            return jsonError(mapped.status, { error: mapped.message });
        }

        const playwrightViewport = { width: 1920, height: 1080 };
        const puppeteerViewport = {
            deviceScaleFactor: 1,
            hasTouch: false,
            height: 1080,
            isLandscape: true,
            isMobile: false,
            width: 1920,
        };

        // Allow dynamic margin (page gap) config via body.pageGap or fallback to defaults
        const pageGap = body.pageGap || {
            top: '0mm',
            bottom: '0mm',
            left: '0mm',
            right: '0mm',
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
                    args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions', '--disable-background-networking'],
                    headless: true,
                });
            }
            const ctx = await pwBrowser.newContext({ viewport: playwrightViewport });
            const pwPage = await ctx.newPage();
            await pwPage.setContent(content, { waitUntil: 'load' });
            pdfBuffer = await pwPage.pdf({
                format: 'A4',
                printBackground: true,
                margin: pageGap,
                preferCSSPageSize: false,
                displayHeaderFooter: false,
            });
            await pwBrowser.close();
            console.log('[pdf] playwright success');
        } catch (playwrightError) {
            console.warn('[pdf] playwright failed, falling back to puppeteer:', playwrightError instanceof Error ? playwrightError.message : playwrightError);

            // ── Puppeteer (fallback) ──────────────────────────────────────────
            let puppeteerBrowser: any;
            try {
                if (isProd) {
                    const puppeteerPkg = await import('puppeteer-core');
                    const chromiumBin = (await import('@sparticuz/chromium')).default;
                    puppeteerBrowser = await puppeteerPkg.launch({
                        args: puppeteerPkg.defaultArgs({ args: chromiumBin.args, headless: 'shell' }),
                        defaultViewport: puppeteerViewport,
                        executablePath: await chromiumBin.executablePath(remotePackUrl),
                        headless: 'shell',
                    });
                } else {
                    const puppeteerPkg = await import('puppeteer');
                    const executablePath = typeof puppeteerPkg.executablePath === 'function'
                        ? await puppeteerPkg.executablePath()
                        : puppeteerPkg.executablePath;
                    if (!executablePath || !fs.existsSync(executablePath)) {
                        throw new Error('Chromium binary not found for Puppeteer fallback.');
                    }
                    puppeteerBrowser = await puppeteerPkg.launch({
                        args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions', '--disable-background-networking'],
                        executablePath,
                        headless: true,
                        defaultViewport: puppeteerViewport,
                    });
                }
                const page = await puppeteerBrowser.newPage();
                await page.setContent(content, { waitUntil: 'load' });
                pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: pageGap,
                    preferCSSPageSize: false,
                    displayHeaderFooter: false,
                });
                await puppeteerBrowser.close();
                console.log('[pdf] puppeteer fallback success');
            } catch (puppeteerError) {
                if (puppeteerBrowser) await puppeteerBrowser.close().catch(() => { });
                throw puppeteerError;
            }
        }

        // Generate filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        if (userId) {
            const { consumeUsage } = await import('@/lib/subscription-server');
            await consumeUsage(userId, 'download');
        } else {
            await consumeGuestUsage('download');
        }

        // Return PDF as response
        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.log(error)
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