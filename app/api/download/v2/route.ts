/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
import fs from 'fs';

// Vercel Settings: Chromium takes ~2-4s to download and launch.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const enableProdPlaywright = !['0', 'false', 'no', 'off'].includes(
    String(process.env.ENABLE_PROD_PLAYWRIGHT ?? 'true').toLowerCase()
);

const chromiumVersion = process.env.CHROMIUM_VERSION || '141.0.0';
const chromiumArch = process.arch === 'arm64' ? 'arm64' : 'x64';
const remotePackUrl = `https://github.com/Sparticuz/chromium/releases/download/v${chromiumVersion}/chromium-v${chromiumVersion}-pack.${chromiumArch}.tar`;

function getLocalBrowserExecutableCandidates() {
    const envCandidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_PATH,
        process.env.CHROMIUM_PATH,
        process.env.EDGE_PATH,
    ].filter((value): value is string => Boolean(value));

    const windowsCandidates = [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ];

    const linuxAndMacCandidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];

    const allCandidates = [...envCandidates, ...windowsCandidates, ...linuxAndMacCandidates];
    return Array.from(new Set(allCandidates)).filter((candidate) => fs.existsSync(candidate));
}

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
        const viewport = { width: 794, height: 1123 };

        // 5. PDF Configuration
        const pageGap = body.pageGap || {
            top: '4mm',
            bottom: '4mm',
            left: '10mm',
            right: '10mm',
        };

        const puppeteerViewport = {
            deviceScaleFactor: 1,
            hasTouch: false,
            height: 1123,
            isLandscape: false,
            isMobile: false,
            width: 794,
        };

        let pdfBuffer!: Buffer;

        // Prefer Playwright, but fall back to Puppeteer if the local Playwright browser is missing.
        try {
            let pwBrowser: any;
            if (isProd && !enableProdPlaywright) {
                throw new Error('Playwright disabled in production; using Puppeteer fallback.');
            }

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

            const context = await pwBrowser.newContext({ viewport });
            const page = await context.newPage();
            await page.setContent(content, { waitUntil: 'networkidle' });
            pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: pageGap,
                preferCSSPageSize: false,
            });
            await pwBrowser.close();
        } catch (playwrightError) {
            console.warn('[pdf:v2] playwright failed, falling back to puppeteer:', playwrightError instanceof Error ? playwrightError.message : playwrightError);

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
                    const puppeteerExecutablePath = typeof puppeteerPkg.executablePath === 'function'
                        ? await puppeteerPkg.executablePath()
                        : puppeteerPkg.executablePath;

                    const launchCandidates = Array.from(new Set([
                        puppeteerExecutablePath,
                        ...getLocalBrowserExecutableCandidates(),
                    ].filter((value): value is string => Boolean(value))));

                    let lastLaunchError: unknown = null;

                    for (const candidate of launchCandidates) {
                        try {
                            puppeteerBrowser = await puppeteerPkg.launch({
                                args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox', '--disable-extensions'],
                                defaultViewport: puppeteerViewport,
                                executablePath: candidate,
                                headless: true,
                            });
                            break;
                        } catch (launchError) {
                            lastLaunchError = launchError;
                            console.warn('[pdf:v2] puppeteer local launch attempt failed:', candidate, launchError instanceof Error ? launchError.message : launchError);
                        }
                    }

                    if (!puppeteerBrowser) {
                        throw new Error(
                            `Chromium binary not found for Puppeteer fallback. Tried ${launchCandidates.length} executable path(s).` +
                            (lastLaunchError instanceof Error ? ` Last error: ${lastLaunchError.message}` : '')
                        );
                    }
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
        console.error('❌ PDF v2 Download Error:', error);

        return NextResponse.json({
            error: 'PDF generation failed',
            details: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
