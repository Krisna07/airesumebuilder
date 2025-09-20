import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult, ResumeData } from "@/types/types";
import { resumeGenerationPrompt, analyzeResumeToJobFitPrompt } from "@/lib/prompts";
import { parseResponse } from "@/lib/jsonParse";

const api = process.env.GEMINI_API_KEY;
if (!api) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
}
const genAI = new GoogleGenerativeAI(api);

// Central model instances
// analyzeModel: faster, smaller output
const analyzeModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

// resumeModel: allow a bit more room for full structured resume JSON
const resumeModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        temperature: 0.35, // slightly higher for richer bullets
        topP: 0.9,
        maxOutputTokens: 5000,
    },
});

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
            const result = await resumeModel.generateContent(prompt);
            const response = result.response;
            const raw = response.text();
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
            const result = await analyzeModel.generateContent(prompt);
            const response = result.response;
            const raw = response.text()
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
            const result = await analyzeModel.generateContent(prompt);
            const response = await result.response;
            const raw = await response.text();
            return parseResponse(raw);
        } catch (error) {
            console.error("Error extracting URL data:", error);
            throw new Error("Failed to extract URL data");
        }
    }

}
