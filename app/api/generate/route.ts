// app/api/generate-pdf/route.js (Example for App Router)
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { NextRequest } from "next/server";
// / Ensures this runs on the Edge runtime

export async function POST(req: NextRequest) {
    try {
        const { htmlContent } = await req.json();

        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(
                process.platform === "win32" ? "chrome.exe" : undefined
            ),
            headless: true,
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
        await page.emulateMediaType("screen"); // To apply screen styles for printing

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            // Add other PDF options as needed
        });

        await browser.close();

        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=generated.pdf",
            },
        });
    } catch (error) {
        console.error("PDF generation failed:", error);
        return new Response(JSON.stringify({ error: "PDF generation failed" }), {
            status: 500,
        });
    }
}