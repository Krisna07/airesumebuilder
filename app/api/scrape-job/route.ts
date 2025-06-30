import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        // Try to find a job description (common selectors)
        const desc = $(".job-description, .description, [itemprop='description']").text() || $('body').text();
        return NextResponse.json({ description: desc.trim() });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to scrape job description' }, { status: 500 });
    }
}
