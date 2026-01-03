import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ResumeData } from "@/types/types";
import { resumeGenerationPrompt, analyzeResumeToJobFitPrompt } from "@/lib/prompts";
import { parseResponse } from "@/lib/jsonParse";

const api = process.env.GEMINI_API_KEY;
console.log(api)
if (!api) {

    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
}
const genAI = new GoogleGenAI({
    apiKey: api,
});

// Central model instances
// analyzeModel: faster, smaller output
const aiModel = 'gemini-2.5-flash-lite'


function coerceArrayStrings(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
    return [];
}

export class AIService {
    static async generateResume(
        userdata?: ResumeData,
        data?: string,
        jobDescription?: string
    ) {
        // Prefer structured JSON over verbose markdown to reduce hallucinations.
        const sourceResume = userdata
            ? JSON.stringify(userdata)
            : JSON.stringify({ raw: data });

        const prompt = resumeGenerationPrompt(
            JSON.parse(sourceResume) as ResumeData,
            jobDescription || ''
        );

        try {
            const response = await genAI.models.generateContent({
                model: aiModel,
                contents: prompt
            });
            // const response = result.text;
            const raw = response.text;
            const parsed = parseResponse(raw);
            return parsed;
        } catch (error) {
            console.error("Error generating resume:", error);
            throw new Error("Failed to generate resume");
        }
    }

    static async analyzeResume(resumeData: ResumeData, jobDescription: string) {
        // Build prompt using the specialized analyze prompt (caps tokens by slicing arrays internally)
        const prompt = analyzeResumeToJobFitPrompt(resumeData, jobDescription);
        try {
            const response = await genAI.models.generateContent({
                model: aiModel,
                contents: prompt
            });
            // const response = result.response;
            const raw = response.text
            const parsedRaw = parseResponse(raw);
            // console.log("Raw analysis response:", raw);
            const parsed = (parsedRaw ?? {}) as Partial<AnalysisResult>;
            parsed.suggestions = coerceArrayStrings(parsed.suggestions);
            parsed.missingKeywords = coerceArrayStrings(parsed.missingKeywords);
            parsed.strengths = coerceArrayStrings(parsed.strengths);
            if (typeof parsed.matchingPercentage !== "number") {
                // Fallback simple heuristic if model drifted
                parsed.matchingPercentage = 0;
            } else {
                parsed.matchingPercentage = Math.max(
                    0,
                    Math.min(100, Math.round(parsed.matchingPercentage))
                );
            }
            return parsed as AnalysisResult;
        } catch (error) {
            console.error("Error analyzing resume in AIService:", error);
            throw new Error("Failed to analyze resume");
        }
    }

    static async extractUrlData(url: string) {
        const prompt = `SYSTEM: Extract concise metadata for the URL. Return ONLY JSON.
    SCHEMA: {"title": string, "description": string, "image": string, "keywords": string[]}
    RULES:
    - description <= 30 words.
    - keywords: unique lowercase phrases (max 12) ordered by relevance.
    - If image unknown use empty string.
    - No commentary.
    URL: ${url}
    OUTPUT:`;
        try {
            const response = await genAI.models.generateContent({
                model: aiModel,
                contents: prompt
            });

            const raw = await response.text
            return parseResponse(raw);
        } catch (error) {
            console.error("Error extracting URL data:", error);
            throw new Error("Failed to extract URL data");
        }
    }

}
