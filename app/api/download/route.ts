/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
import chromium from '@sparticuz/chromium';
import fs from 'fs'; // added import
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/lib/subscription-server'

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
        let userId: string
        try {
            ({ userId } = await requireUserSession())
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        try {
            await assertQuota(userId, 'download')
        } catch (err) {
            const mapped = mapSubscriptionError(err)
            return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

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
        let executablePath;
        const puppeteerPkg = isProd ? await import('puppeteer-core') : await import('puppeteer');

        if (isProd) {
            executablePath = await chromium.executablePath();
        } else {
            // handle both puppeteer versions where executablePath might be function or string
            executablePath = typeof puppeteerPkg.executablePath === 'function'
                ? await puppeteerPkg.executablePath()
                : puppeteerPkg.executablePath;
        }

        console.log('puppeteer package version:', (puppeteerPkg as any).version ?? 'unknown');
        console.log('resolved executablePath:', executablePath);

        // Choose args per environment - don't reuse sparticuz args in local dev
        const args = isProd
            ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            : [
                // safer flags for local Windows dev
                '--disable-dev-shm-usage',
                '--disable-gpu',
                // DO NOT use '--single-process' on Windows/local — it breaks V8 proxy resolver and crashes Chromium.
                '--no-sandbox',
                '--disable-extensions',
                '--disable-background-networking'
            ];

        // Ensure executablePath actually exists locally before launching
        if (!executablePath || (typeof executablePath === 'string' && !fs.existsSync(executablePath))) {
            console.error('Chromium executable not found at resolved path:', executablePath);
            throw new Error('Chromium binary not found. Install puppeteer locally or verify executablePath.');
        }

        const launchOptions = {
            args,
            executablePath,
            headless: true,
            defaultViewport: null,
            // dump io so Chromium stderr/logs appear in server logs (helps debug ECONNRESET)
            dumpio: true,
            timeout: 120000,
        };
        // Try to log puppeteer version (best-effort)
        try {
            const pkg = await import('puppeteer/package.json');
            console.log('local puppeteer version:', pkg?.version ?? 'unknown');
        } catch {
            console.log('puppeteer package.json not found (ok if using puppeteer-core in prod)');
        }

        const browser = await launchWithRetries(puppeteerPkg, launchOptions, 2);

        // log child process PID if available (helps correlate OS-level crashes)
        try {
            const proc: any = (browser as any).process?.();
            if (proc) console.log('chromium pid:', proc.pid);
        } catch { }

        // Allow dynamic margin (page gap) config via body.pageGap or fallback to defaults
        const pageGap = body.pageGap || {
            top: '4mm',
            bottom: '4mm',
            left: '10mm',
            right: '10mm',
        };
        const pageMargin = {
            top: pageGap.top ?? '4mm',
            bottom: pageGap.bottom ?? '4mm',
            left: pageGap.left ?? '10mm',
            right: pageGap.right ?? '10mm',
        };

        const page = await browser.newPage();
        await page.setContent(content, { waitUntil: 'load' });
        await page.emulateMediaType('print');
        await page.addStyleTag({
            content: `@page { size: A4; margin: ${pageMargin.top} ${pageMargin.right} ${pageMargin.bottom} ${pageMargin.left}; }`,
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            preferCSSPageSize: true,
            displayHeaderFooter: false,
        });

        await browser.close();

        // Generate filename
        const filename = body.resumeData?.profile?.fullname
            ? `${body.resumeData.profile.fullname.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Resume.pdf';

        await consumeUsage(userId, 'download')

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

        return NextResponse.json({
            error: 'PDF generation failed',
            details: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
