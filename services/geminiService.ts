import { GoogleGenAI } from "@google/genai";
import { parseStructuredJson } from "@/services/aiProviderUtils";

type JsonSchema = Record<string, unknown>;

export type GeminiCallOptions = {
    model: string;
    prompt: string;
    outputSchema?: JsonSchema;
};

function getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini client not available. Set GEMINI_API_KEY.");
    }

    return new GoogleGenAI({ apiKey });
}

export async function callGeminiModel({ model, prompt, outputSchema }: GeminiCallOptions): Promise<any> {
    const genAI = getClient();
    const config: any = {};

    if (outputSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = outputSchema;
    }

    const response = await genAI.models.generateContent({
        model,
        config,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw =
        response?.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text ?? "")
            .join("")
            .trim() || "";

    if (!raw) {
        throw new Error("Empty response from Gemini");
    }

    if (!outputSchema) {
        return raw;
    }

    return parseStructuredJson(raw, "Gemini");
}


