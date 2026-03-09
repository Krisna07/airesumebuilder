import { AIService } from '@/services/aiServices';
import { NextRequest, NextResponse } from 'next/server';
import { extractJobDetailsPrompt } from '@/lib/prompts';
import { requireUserSession, consumeUsage, mapSubscriptionError } from '@/lib/subscription-server';
import { parseResponse } from '@/lib/jsonParse';

// Import the private AI function - should be moved to AIService class ideally
const callAI = async (prompt: string) => {
  return await AIService.extractJobMetadata(prompt);
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUserSession();

    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description text is required' },
        { status: 400 }
      );
    }

    // Check and consume subscription quota (using 'analysis' quota for AI extraction)
    await consumeUsage(userId, 'analysis');

    // Generate AI extraction
    const prompt = extractJobDetailsPrompt(rawText);
    const result = await callAI(prompt);
    // AI now returns a parsed object
    const extracted = result as {
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
