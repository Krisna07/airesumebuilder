export function extractJsonCandidate(content: string): string | null {
    const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
        return fenced[1].trim();
    }

    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return content.slice(firstBrace, lastBrace + 1).trim();
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
    try {
        return JSON.parse(content);
    } catch {
        const extracted = extractJsonCandidate(content);
        if (!extracted) {
            throw new Error(`Failed to parse JSON response from ${providerLabel}`);
        }

        return JSON.parse(extracted);
    }
}
