/**
 * Groq AI Service - Ultra-fast inference
 * Speed: 70-300+ tokens/second vs OpenRouter's 10-20 tokens/second
 * Cost: Same or cheaper
 * 
 * Groq is purpose-built for low-latency LLM inference
 */

import Groq from "groq-sdk";

const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

if (!hasGroqKey) {
    console.warn('GroqService: GROQ_API_KEY not found. Using fallback providers.');
}

function getGroqClient() {
    if (!hasGroqKey) {
        return null;
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Groq's fastest models as of 2026
export const GROQ_MODELS = {
    // Fastest models - best for speed-critical tasks
    FAST: "llama-3.1-8b-instant", // <100ms latency, 70+ tok/s
    FAST_REASONING: "mixtral-8x7b-32768", // Faster reasoning, 200+ tok/s
    FAST_LONG_CONTEXT: "llama-3.1-70b-versatile", // Better quality, still 100+ tok/s

    // Medium speed (still faster than OpenRouter)
    BALANCED: "llama-3.1-70b-versatile", // Good quality + speed
};

export type GroqModelType = keyof typeof GROQ_MODELS;

export interface GroqCallOptions {
    model: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
}

/**
 * Call Groq API with structured output
 * Returns raw response - caller should parse
 */
export async function callGroqModel(options: GroqCallOptions): Promise<string> {
    const client = getGroqClient();
    if (!client) {
        throw new Error("Groq API key not configured");
    }

    try {
        const response = await client.chat.completions.create({
            model: options.model,
            messages: [
                {
                    role: "user",
                    content: options.prompt,
                },
            ],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 4096,
            top_p: options.top_p ?? 1,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from Groq");
        }

        return content;
    } catch (error: any) {
        console.error("Groq API error:", error?.message);
        throw error;
    }
}

/**
 * Parse JSON response from Groq
 */
export function parseGroqJsonResponse(response: string): any {
    try {
        // Try direct JSON parsing first
        return JSON.parse(response);
    } catch {
        // If wrapped in markdown code blocks, extract it
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch {
                // Fall back to direct parse
            }
        }

        // Try parsing the whole response as JSON
        throw new Error(`Failed to parse JSON from Groq response`);
    }
}

/**
 * Check if Groq is available
 */
export function isGroqAvailable(): boolean {
    return hasGroqKey;
}

/**
 * Get model latency estimate
 */
export function getModelLatencyEstimate(model: string): string {
    if (model.includes("8b")) return "<100ms";
    if (model.includes("70b") || model.includes("mixtral")) return "100-200ms";
    return "unknown";
}
