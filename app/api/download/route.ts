/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateTemplateHTML } from "@/lib/template-utils";
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

// Vercel Settings: Chromium takes ~2-4s to download and launch.
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

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
        const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
        
        // 3. Setup Launch Options
        // We use the hosted Brotli pack to keep the Vercel deployment size tiny.
        const remotePackUrl = "https://github.com/sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar";

        const launchOptions = {
            args: isProd ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: isProd 
                ? await chromium.executablePath(remotePackUrl) 
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Path for Mac. Use your local path for Windows/Linux.
            headless: chromium.headless,
        };

        // 4. Launch Browser
        browser = await puppeteer.launch(launchOptions);
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
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
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
