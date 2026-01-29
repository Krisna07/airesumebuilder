import { NextRequest, NextResponse } from 'next/server';
import { extractJobDetailsPrompt } from '@/lib/prompts';
import { requireUserSession, consumeUsage, mapSubscriptionError } from '@/lib/subscription-server';
import { parseResponse } from '@/lib/jsonParse';
import { checkRateLimit } from '@/lib/rateLimit';

// Import the private AI function - should be moved to AIService class ideally
import { GoogleGenAI, Content, GenerateContentResponse } from '@google/genai';

const api = process.env.GEMINI_API_KEY;
const genAI = api ? new GoogleGenAI({ apiKey: api }) : null;
const aiModel = process.env.GENAI_MODEL || 'gemini-2.5-flash-lite';

const callAI = async (prompt: string) => {
  if (!genAI) {
    throw new Error('AI client not initialized');
  }
  const response: GenerateContentResponse = await genAI.models.generateContent({ model: aiModel, contents: prompt });
  const content: Content | undefined = response?.candidates?.[0]?.content;
  if (!content) throw new Error('No content returned from AI');
  const raw = content.parts?.map(part => part.text).join('') || '';
  if (!raw) throw new Error('Empty AI response');
  return raw;
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUserSession();

    const rl = checkRateLimit({ key: `user:${userId}:ai:extract-job`, windowMs: 60_000, max: 15 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description text is required' },
        { status: 400 }
      );
    }
    if (rawText.length > 120_000) {
      return NextResponse.json({ error: 'Job description too large' }, { status: 413 })
    }

    // Check and consume subscription quota (using 'analysis' quota for AI extraction)
    await consumeUsage(userId, 'analysis');

    // Generate AI extraction
    const prompt = extractJobDetailsPrompt(rawText);
    const result = await callAI(prompt);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to extract job details' },
        { status: 500 }
      );
    }

    // Parse the AI response using shared parser
    const extracted = parseResponse(result) as {
      title: string;
      company: string;
      location: string;
      domain: string;
      description: string;
    };

    // Validate the extracted data has required fields
    if (!extracted.title || !extracted.description) {
      return NextResponse.json(
        { error: 'Incomplete job details extracted' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        title: extracted.title,
        company: extracted.company || 'Unknown',
        location: extracted.location || 'Not specified',
        domain: extracted.domain || 'Other',
        description: extracted.description,
        url: '' // Will be set if user provided URL initially
      }
    });
  } catch (error) {
    console.error('Extract job details error:', error);
    const mapped = mapSubscriptionError(error);
    return NextResponse.json(
      { error: mapped.message, quotaExceeded: mapped.status === 403 },
      { status: mapped.status }
    );
  }
}
