/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
// Dynamic imports for puppeteer and chromium
import fs from 'fs';

// Force Node.js runtime for this route (not edge)
export const runtime = "nodejs";

const isProd = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;

async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function launchWithRetries(puppeteerPkg: any, launchOptions: Record<string, any>, retries = 2) {
    let attempt = 0;
    while (true) {
        try {
            const browser = await puppeteerPkg.launch(launchOptions);
            console.log(`puppeteer.launch succeeded (attempt ${attempt + 1})`);
            return browser;
        } catch (err: any) {
            attempt++;
            console.warn(`puppeteer.launch failed (attempt ${attempt}):`, err?.message ?? err);
            if (attempt > retries) throw err;
            const backoff = Math.min(30000, 300 * 2 ** attempt);
            await sleep(backoff + Math.floor(Math.random() * 300));
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let content = body.content;

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

        let browser;
        let puppeteerPkg;
        let chromium;
        const viewport = {
            deviceScaleFactor: 1,
            hasTouch: false,
            height: 1080,
            isLandscape: true,
            isMobile: false,
            width: 1920,
        };
        if (isProd) {
            puppeteerPkg = await import('puppeteer-core');
            chromium = (await import('@sparticuz/chromium')).default;
            browser = await puppeteerPkg.launch({
                args: puppeteerPkg.defaultArgs({ args: chromium.args, headless: "shell" }),
                defaultViewport: viewport,
                executablePath: await chromium.executablePath(),
                headless: "shell",
            });
        } else {
            puppeteerPkg = await import('puppeteer');
            // handle both puppeteer versions where executablePath might be function or string
            const executablePath = typeof puppeteerPkg.executablePath === 'function'
                ? await puppeteerPkg.executablePath()
                : puppeteerPkg.executablePath;
            // Ensure executablePath actually exists locally before launching (only check in dev)
            try {
                if (!executablePath || (typeof executablePath === 'string' && !fs.existsSync(executablePath))) {
                    console.error('Chromium executable not found at resolved path:', executablePath);
                    throw new Error('Chromium binary not found. Install puppeteer locally or verify executablePath.');
                }
            } catch (err) {
                console.error('Error checking Chromium executable:', err);
                throw err;
            }
            browser = await puppeteerPkg.launch({
                args: [
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-sandbox',
                    '--disable-extensions',
                    '--disable-background-networking',
                ],
                executablePath,
                headless: true,
                defaultViewport: viewport,
            });
        }

        console.log('puppeteer package version:', (puppeteerPkg as any).version ?? 'unknown');
        console.log('resolved executablePath:', executablePath);

        // Choose args per environment - don't reuse sparticuz args in local dev
        let args;
        if (isProd && chromium) {
            args = [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
        } else {
            args = [
                // safer flags for local Windows dev
                '--disable-dev-shm-usage',
                '--disable-gpu',
                // DO NOT use '--single-process' on Windows/local — it breaks V8 proxy resolver and crashes Chromium.
                '--no-sandbox',
                '--disable-extensions',
                '--disable-background-networking'
            ];
        }

        // Ensure executablePath actually exists locally before launching (only check in dev)
        if (!isProd) {
            try {
                if (!executablePath || (typeof executablePath === 'string' && !fs.existsSync(executablePath))) {
                    console.error('Chromium executable not found at resolved path:', executablePath);
                    throw new Error('Chromium binary not found. Install puppeteer locally or verify executablePath.');
                }
            } catch (err) {
                console.error('Error checking Chromium executable:', err);
                throw err;
            }
        }

        // log child process PID if available (helps correlate OS-level crashes)
        try {
            const proc: any = (browser as any).process?.();
            if (proc) console.log('chromium pid:', proc.pid);
        } catch { }

        const page = await browser.newPage();
        await page.setContent(content, { waitUntil: 'load' });

        // Allow dynamic margin (page gap) config via body.pageGap or fallback to defaults
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
            displayHeaderFooter: false,
        });

        await browser.close();

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