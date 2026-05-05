import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Optional dynamic import for puppeteer only if needed (LinkedIn dynamic pages)
// Use loose typing for dynamic imports to avoid build issues in edge/serverless
let puppeteer: any = null; // dynamic import placeholder
let chromium: any = null;  // dynamic import placeholder
let launchMode: 'lambda-chromium' | 'bundled' | 'unknown' = 'unknown';

interface JobExtract {
    url: string;
    domain: string;
    success: boolean;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    rawHtmlLength?: number;
    error?: string;
    usedBrowser?: boolean;
}

const normalizeWS = (txt: string | undefined | null) => (txt || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const normalizeUrl = (input: string): string => {
    try {
        const u = new URL(input);
        if (/seek\./i.test(u.hostname)) {
            // Convert search result link with jobId param into direct job ad URL
            const jobId = u.searchParams.get('jobId');
            if (jobId && !/\/job\//.test(u.pathname)) {
                return `${u.origin}/job/${jobId}`;
            }
        }
        return input;
    } catch { return input; }
};

const axiosFetch = async (url: string, attempt = 1): Promise<string> => {
    const ua = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
    const headers = {
        'user-agent': ua,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'upgrade-insecure-requests': '1',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document'
    } as Record<string, string>;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(url, {
            headers,
            signal: controller.signal,
            redirect: 'follow',
        });

        if (response.status >= 500) {
            throw new Error(`Upstream returned ${response.status}`);
        }

        return await response.text();
    } finally {
        clearTimeout(timeout);
    }
};

const fetchHTML = async (rawUrl: string, useBrowser: boolean): Promise<{ html: string; usedBrowser: boolean; }> => {
    const url = normalizeUrl(rawUrl);
    if (!useBrowser) {
        // Try up to 3 attempts rotating UA if 403/401/429
        for (let attempt = 1; attempt <= 3; attempt++) {
            const html = await axiosFetch(url, attempt);
            if (/<!doctype/i.test(html) || html.length > 500) {
                // crude check for real HTML
                if (!/Access Denied|captcha/i.test(html)) return { html, usedBrowser: false };
            }
            // wait small backoff before next attempt
            await new Promise(r => setTimeout(r, 250 * attempt));
        }
        // If still failing and domain likely dynamic, escalate
        if (/linkedin\.|seek\./i.test(url)) {
            return fetchHTML(url, true);
        }
        return { html: '', usedBrowser: false };
    }
    // Decide environment: windows/local -> use bundled puppeteer; linux lambda -> chromium+core
    const isWin = process.platform === 'win32';
    const isLambda = !!process.env.LAMBDA_TASK_ROOT || process.env.AWS_REGION;
    try {
        if (!puppeteer) {
            if (!isWin && isLambda) {
                // Lambda style
                const chromiumMod: any = await import('@sparticuz/chromium');
                chromium = chromiumMod.default || chromiumMod;
                puppeteer = await import('puppeteer-core');
                launchMode = 'lambda-chromium';
            } else {
                // Local dev or other env: use full puppeteer (bundled Chromium)
                puppeteer = await import('puppeteer');
                launchMode = 'bundled';
            }
        }

        let browser: any;
        if (launchMode === 'lambda-chromium') {
            const chromiumRef = chromium as any;
            const execPath = await chromiumRef.executablePath?.();
            browser = await (puppeteer as any).launch({
                args: chromiumRef.args,
                defaultViewport: chromiumRef.defaultViewport,
                executablePath: execPath,
                headless: chromiumRef.headless,
                ignoreHTTPSErrors: true,
            });
        } else {
            browser = await (puppeteer as any).launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }
        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36');
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await new Promise(res => setTimeout(res, 1200));
            const html = await page.content();
            return { html, usedBrowser: true };
        } finally {
            await browser.close();
        }
    } catch (err) {
        console.error('Browser launch failure:', (err as Error).message, 'mode=', launchMode);
        return { html: '', usedBrowser: false };
    }
};
// removed global extractUrl to avoid race conditions

const extractByDomain = ($: cheerio.CheerioAPI, domain: string, urlObj: URL) => {
    let internalExtractUrl = urlObj.origin + urlObj.pathname + (/linkedin\.|indeed\./i.test(domain) ? urlObj.search : '');
    const lower = domain.toLowerCase();
    let title = '';
    let company = '';
    let location = '';
    let description = '';

    const grab = (selectors: string[]) => {
        for (const sel of selectors) {
            const txt = normalizeWS($(sel).first().text());
            if (txt) return txt;
        }
        return '';
    };
    const grabHTML = (selectors: string[]) => {
        for (const sel of selectors) {
            const el = $(sel).first();
            if (el && el.length) return normalizeWS(el.text());
        }
        return '';
    };

    if (lower.includes('linkedin.')) {
        title = grab(['h1[data-test-job-title]', 'h1.top-card-layout__title', 'h1']);
        company = grab(['a.topcard__org-name-link', '.top-card-layout__second-subline a', '.topcard__flavor a']);
        location = grab(['.top-card-layout__third-subline', '.topcard__flavor--bullet']);
        description = grabHTML(['#job-details', '.show-more-less-html__markup', '.description__text']);
        internalExtractUrl = urlObj.origin + urlObj.pathname + urlObj.search;

    } else if (lower.includes('seek.')) {
        title = grab(['h1[data-automation=job-detail-title]', 'h1']);
        company = grab(['span[data-automation=advertiser-name]', 'a[data-automation=advertiser-name]']);
        location = grab(['span[data-automation=job-detail-location]']);
        description = grabHTML(['div[data-automation=jobAdDetails]', '[data-automation=jobAdDetails]']);
        internalExtractUrl = urlObj.origin + urlObj.pathname;
    } else if (lower.includes('jora.') || lower.includes('job')) { // broad for jora
        title = grab(['h1', '.job-title']);
        company = grab(['.job-company', '.company', '.company-name']);
        location = grab(['.job-location', '.location']);
        description = grabHTML(['.job-description', '#job-details', '.description']);
    } else if (lower.includes('indeed.')) {
        title = grab(['h1.jobsearch-JobInfoHeader-title', 'h1']);
        company = grab(['div.jobsearch-InlineCompanyRating div:first-child', '.jobsearch-CompanyInfoWithoutHeaderImage div:nth-child(1)']);
        location = grab(['div.jobsearch-JobInfoHeader-subtitle div:last-child']);
        description = grabHTML(['#jobDescriptionText']);
        internalExtractUrl = urlObj.origin + urlObj.pathname + urlObj.search.split('&')[0];
    } else if (lower.includes('glassdoor.')) {
        title = grab(['div[data-test=job-title]', 'h1']);
        company = grab(['div[data-test=employerName]']);
        location = grab(['div[data-test=location]']);
        description = grabHTML(['div.jobDescriptionContent', 'section[data-test=job-description]']);
        internalExtractUrl = urlObj.origin + urlObj.pathname;
    } else {
        // Generic fallback
        title = grab(['h1', 'header h1', 'h1.title']);
        company = grab(['[class*="company"]', '.employer', '.job-company']);
        location = grab(['[class*="location"]', '.job-location']);
        description = grabHTML([
            '.job-description',
            '[itemprop=description]',
            '.description',
            '#job-details',
            'article',
            'main'
        ]);
    }

    // Fallback for empty description: take large text body but trim to avoid everything
    if (!description) {
        const bodyText = normalizeWS($('body').text());
        description = bodyText.slice(0, 25000); // cap
    }

    return { title, company, location, description, extractUrl: internalExtractUrl };
};

// Detect common anti-bot / Cloudflare challenge pages so we don't treat them as real job content
const isChallengePage = (html: string): boolean => {
    if (!html || html.length < 200) return false;
    const lowered = html.toLowerCase();
    return (
        lowered.includes('cf_chl_opt') ||
        lowered.includes('cloudflare') && lowered.includes('attention required') ||
        lowered.includes('confirm you are human') ||
        lowered.includes('/cdn-cgi/challenge-platform')
    );
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const urls: string[] = Array.isArray(body.urls)
            ? body.urls
            : body.url
                ? [body.url]
                : [];
        if (!urls.length) {
            return NextResponse.json({ error: 'No URL(s) provided. Provide `url` or `urls`.' }, { status: 400 });
        }

        // Decide if a browser is needed for a url
        // Force browser for LinkedIn & Seek (Seek often protected / dynamic)
        const needsBrowser = (u: string) => /(linkedin\.com|seek\.com)/.test(u) && (process.env.SCRAPE_USE_BROWSER !== 'false');

        const results: JobExtract[] = [];

        for (const url of urls.slice(0, 5)) { // limit to 5 as requested
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, '');
            try {
                const { html, usedBrowser } = await fetchHTML(url, needsBrowser(url));
                if (!html || isChallengePage(html)) {
                    results.push({
                        url,
                        domain,
                        success: false,
                        error: 'blocked_or_challenge',
                    });
                    continue;
                }


                const $ = cheerio.load(html);
                let meta = extractByDomain($, domain, urlObj);

                // If metadata is incomplete, use AI to refine it from the description text
                if (!meta.title || !meta.company || meta.title === 'Title Not Found') {
                    try {
                        const refined = await AIService.extractJobMetadata(meta.description || html.slice(0, 8000));
                        if (refined) {
                            meta = {
                                ...meta,
                                title: refined.title || meta.title || 'Unknown Title',
                                company: refined.company || meta.company || 'Unknown Company',
                                location: refined.location || meta.location || 'Not specified',
                                description: refined.description || meta.description
                            };
                        }
                    } catch (e) {
                        console.warn('AI metadata refinement failed:', e);
                    }
                }

                // Additional Seek-specific enhancement
                if (domain.includes('seek.') && meta.description && meta.description.length < 120) {
                    try {
                        const nextDataRaw = $('script#__NEXT_DATA__').first().html();
                        if (nextDataRaw) {
                            const json = JSON.parse(nextDataRaw);
                            // Heuristic path search for job ad details
                            const traverse = (obj: any, found: any[] = []) => {
                                if (!obj || typeof obj !== 'object') return found;
                                if (obj.classification || obj.advertiser || obj.jobAdDetails || obj.adDetailsHtml) {
                                    found.push(obj);
                                }
                                for (const k of Object.keys(obj)) traverse(obj[k], found);
                                return found;
                            };
                            const candidates = traverse(json); // gather objects that might be job nodes
                            const htmlBlocks: string[] = [];
                            for (const c of candidates) {
                                if (typeof c === 'object') {
                                    if (c.jobAdDetails?.content) htmlBlocks.push(c.jobAdDetails.content);
                                    if (c.adDetailsHtml) htmlBlocks.push(c.adDetailsHtml);
                                }
                            }
                            if (!htmlBlocks.length) {
                                // Look for generic content field
                                for (const c of candidates) {
                                    if (c?.content && typeof c.content === 'string' && c.content.length > 80) {
                                        htmlBlocks.push(c.content);
                                    }
                                }
                            }
                            if (htmlBlocks.length) {
                                // Choose longest block
                                const best = htmlBlocks.sort((a, b) => b.length - a.length)[0];
                                const $$ = cheerio.load(best);
                                const cleaned = normalizeWS($$.text());
                                if (cleaned.length > meta.description.length) {
                                    meta.description = cleaned.slice(0, 25000);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Seek __NEXT_DATA__ parse failed:', (e as Error).message);
                    }
                }

                // If still too short, attempt a crude rebuild from large text blocks
                if (meta.description.length < 60) {
                    const paragraphs = $('p').map((_, el) => normalizeWS($(el).text())).get().filter(t => t.length > 40);
                    if (paragraphs.length) {
                        const combined = paragraphs.join('\n');
                        if (combined.length > meta.description.length) meta.description = combined.slice(0, 25000);
                    }
                }
                results.push({
                    url: meta.extractUrl || url,
                    domain,
                    success: true,
                    ...meta,
                    rawHtmlLength: html.length,
                    usedBrowser
                });
            } catch (err: unknown) {
                const message = (err as Error)?.message || 'Unknown error';
                console.error('Scrape error for', url, message);
                results.push({
                    url,
                    domain,
                    success: false,
                    error: message
                });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        return NextResponse.json({
            results,
            meta: { count: results.length, succeeded, failed: results.length - succeeded }
        });
    } catch (error) {
        console.error('Error scraping job description(s):', error);
        return NextResponse.json({ error: 'Failed to scrape job description(s)' }, { status: 500 });
    }
}
