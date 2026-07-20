export function extractJsonCandidate(content: string): string | null {
    // Strip reasoning model think-blocks (e.g. <think>...</think>) before parsing
    const stripped = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    const cleaned = stripped || content

    const fenced = cleaned.match(/```json\s*([\s\S]*?)\s*```/i)
    if (fenced?.[1]) {
        return fenced[1].trim();
    }

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return cleaned.slice(firstBrace, lastBrace + 1).trim();
    }

    return null;
}

export function buildStructuredPrompt(prompt: string): string {
    return [
        "Return ONLY valid JSON. Do not include markdown, code fences, or commentary.",
        prompt,
    ].join("\n\n");
}

export function parseStructuredJson(content: string, providerLabel: string): any {
    // Strip reasoning model think-blocks before parsing
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    try {
        return JSON.parse(cleaned);
    } catch {
        const extracted = extractJsonCandidate(cleaned);
        if (!extracted) {
            throw new Error(`Failed to parse JSON response from ${providerLabel}`);
        }

        return JSON.parse(extracted);
    }
}
