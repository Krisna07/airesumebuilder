/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';
import { resolveUserIdFromRequest } from '@/lib/auth-user';

// Force Node.js runtime for this route (not edge)
export const runtime = "nodejs";

const isProd = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;
const enableProdPlaywright = !['0', 'false', 'no', 'off'].includes(
    String(process.env.ENABLE_PROD_PLAYWRIGHT ?? 'true').toLowerCase()
);
const chromiumVersion = process.env.CHROMIUM_VERSION || '141.0.0';
const chromiumArch = process.arch === 'arm64' ? 'arm64' : 'x64';
const remotePackUrl = `https://github.com/Sparticuz/chromium/releases/download/v${chromiumVersion}/chromium-v${chromiumVersion}-pack.${chromiumArch}.tar`;

function jsonError(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let content = body.content;
        const userId = await resolveUserIdFromRequest(req);

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

        // Quota check (identical to v1)
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

        let browser: any;
        let page: any;
        const viewport = { width: 1920, height: 1080 };

        if (isProd && !enableProdPlaywright) {
            const puppeteerPkg = await import('puppeteer-core');
            const chromiumBin = (await import('@sparticuz/chromium')).default;
            browser = await puppeteerPkg.launch({
                args: puppeteerPkg.defaultArgs({ args: chromiumBin.args, headless: 'shell' }),
                defaultViewport: {
                    deviceScaleFactor: 1,
                    hasTouch: false,
                    height: 1080,
                    isLandscape: true,
                    isMobile: false,
                    width: 1920,
                },
                executablePath: await chromiumBin.executablePath(remotePackUrl),
                headless: 'shell',
            });
            page = await browser.newPage();
            await page.setContent(content, { waitUntil: 'load' });
        } else {
            if (isProd) {
                // Production opt-in: use playwright-core with @sparticuz/chromium binary
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
                    args: [
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-sandbox',
                        '--disable-extensions',
                        '--disable-background-networking',
                    ],
                    headless: true,
                });
            }

            const context = await browser.newContext({ viewport });
            page = await context.newPage();
            await page.setContent(content, { waitUntil: 'load' });
        }

        // Allow dynamic margin (page gap) config via body.pageGap or fallback to defaults
        const pageGap = body.pageGap || {
            top: '0mm',
            bottom: '0mm',
            left: '0mm',
            right: '0mm',
        };

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: pageGap,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
        });

        await browser.close();

        // Consume quota (identical to v1)
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        if (userId) {
            const { consumeUsage } = await import('@/lib/subscription-server');
            await consumeUsage(userId, 'download');
        } else {
            await consumeGuestUsage('download');
        }

        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.byteLength.toString(),
            },
        });

    } catch (error) {
        console.error('❌ PDF v2 generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return new Response(JSON.stringify({
            error: 'PDF generation failed',
            details: errorMessage,
            timestamp: new Date().toISOString(),
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
