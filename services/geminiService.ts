/**
 * Gemini API service (direct REST)
 * Keeps provider integration lightweight and independent from SDK surface changes.
 */

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

if (!hasGeminiKey) {
    console.warn('GeminiService: GEMINI_API_KEY not found. Using fallback providers.');
}

export interface GeminiCallOptions {
    model: string;
    prompt: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: 'application/json' | 'text/plain';
}

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = {
    candidates?: GeminiCandidate[];
    error?: { message?: string };
};

export function isGeminiAvailable(): boolean {
    return hasGeminiKey;
}

export async function callGeminiModel(options: GeminiCallOptions): Promise<string> {
    if (!hasGeminiKey) {
        throw new Error('Gemini API key not configured');
    }

    const apiKey = process.env.GEMINI_API_KEY as string;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [{ text: options.prompt }],
            },
        ],
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 4096,
            responseMimeType: options.responseMimeType ?? 'text/plain',
        },
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
        const message = data?.error?.message || `Gemini API error: ${response.status}`;
        throw new Error(message);
    }

    const text = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();

    if (!text) {
        throw new Error('Empty response from Gemini');
    }

    return text;
}
