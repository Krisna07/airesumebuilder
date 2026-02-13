/* eslint-disable @typescript-eslint/no-explicit-any */
import { Content, GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { AnalysisResult, CoverLetterResponse, JobDescription, ResumeData } from "@/types/types";
import { resumeGenerationPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt } from "@/lib/prompts";
import { parseResponse } from "@/lib/jsonParse";
import { OpenRouter } from '@openrouter/sdk';

const openRouterKey = process.env.OPENROUTER_API_KEY;
const api = process.env.GEMINI_API_KEY;

if (!openRouterKey && !api) {
    console.warn('AIService: No API keys found for Gemini or OpenRouter. AI functionalities will be disabled.');
}
const openRouter = new OpenRouter({ apiKey: openRouterKey });

const genAI = new GoogleGenAI({ apiKey: api });

const aiModel = process.env.GENAI_MODEL || 'gemini-2.5-flash-lite';
const fallBackModel = 'gemini-2.5-flash';

function coerceArrayStrings(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
    return [];
}
const callAIWithRetry = async (prompt: string, retries = 3) => {
    console.log("Calling Gemini AI with prompt:");

    if (!genAI && !openRouter) {
        throw new Error('AI clients are not initialized. This function must be run on the server with GEMINI_API_KEY or OPENROUTER_API_KEY set.');
    }
    try {
        let modelToUse = aiModel;
        if (retries < 3) {
            modelToUse = fallBackModel; // switch to fallback model on retry
        }
        if (retries < 2) {
            modelToUse = 'gemini-3-flash'; // switch to extended context model on second retry
        }
        if (!genAI) throw new Error('Gemini client not available');
        const response: GenerateContentResponse = await genAI.models.generateContent({ model: modelToUse, contents: prompt });

        // if(!response.candidates || response.candidates.length ===0){
        //     throw new Error('No candidates returned from AI model');
        // }{
        const content: Content | undefined = (response && response?.candidates) ? response?.candidates[0]?.content : undefined;
        if (!content) {
            throw new Error('No content returned from AI model');
        }
        const raw: string | undefined = content.parts ? content.parts.map(part => part.text).join('') : undefined;
        if (!raw) {
            throw new Error('Ai cannot gennerate your response try again later');
        }
        return raw;

    } catch (error) {
        if (retries > 0) {
            console.warn(`AI call failed, retrying... (${retries} attempts left)`, error);
            return callAIWithRetry(prompt, retries - 1);
        }
        throw error;
    }
};


const callOpenRouterAI = async (prompt: string, retries = 3) => {
    console.log("Calling OpenRouter AI with prompt:");
    if (!openRouter) {
        throw new Error('OpenRouter client is not initialized. This function must be run on the server with OPENROUTER_API_KEY set.');
    }
    try {
        let modelToUse = 'mistralai/mistral-7b-instruct:free';
        if (retries == 2) {
            modelToUse = 'nvidia/nemotron-3-nano-30b-a3b:free';
        }
        if (retries == 1) {
            modelToUse = 'openai/gpt-oss-20b:free';
        }
        if (!openRouter) throw new Error('OpenRouter client not available');
        const response = await openRouter.chat.send({
            model: modelToUse,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            stream: false,
        });
        return response.choices[0].message.content

    } catch (error) {
        if (retries > 0) {
            console.warn(`OpenRouter AI call failed, retrying... (${retries} attempts left)`, error);
            return callOpenRouterAI(prompt, retries - 1);
        }
    }
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
            const response = openRouterKey ? await callOpenRouterAI(prompt) : await callAIWithRetry(prompt);
            const raw = response;
            const parsed = parseResponse(raw as string);
            console.log(parsed)
            return parsed as ResumeData;
        } catch (error) {
            console.error("Error generating resume:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            throw new Error("Failed to generate resume");
        }
    }

    static async analyzeResume(resumeData: ResumeData, jobDescription: string) {
        // Build prompt using the specialized analyze prompt (caps tokens by slicing arrays internally)
        const prompt = analyzeResumeToJobFitPrompt(resumeData, jobDescription);
        try {
            const response = await callOpenRouterAI(prompt);
            const raw: any = response
            const parsedRaw = parseResponse(raw);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error analyzing resume in AIService:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
            if (!genAI) throw new Error('Gemini client not initialized on server');
            const response = await genAI.models.generateContent({ model: aiModel, contents: prompt });
            const raw = await response.text;
            return parseResponse(raw);
        } catch (error) {
            console.error("Error extracting URL data:", error);
            throw new Error("Failed to extract URL data");
        }
    }

    static async generateCoverLetter(resumeData: ResumeData, jobDescription: JobDescription, analysis?: AnalysisResult) {

        try {
            const sourceResume = resumeData
                ? JSON.stringify(resumeData)
                : JSON.stringify({ raw: resumeData });
            // console.log(resumeData, jobDescription, analysis);
            const prompt = coverLetterPrompt(
                JSON.parse(sourceResume) as ResumeData,
                jobDescription,
                analysis ? analysis : undefined
            );

            if (!openRouter) throw new Error('OpenRouter client not initialized on server');
            const response = await callOpenRouterAI(prompt);
            const raw: any = response;
            const parsed = parseResponse(raw);
            const result = {
                parsed: parsed as CoverLetterResponse,
                jobTitle: jobDescription.title,
                companyName: jobDescription.company,
                location: jobDescription.location,
                userDetails: resumeData.profile
            }
            return result

        } catch (error) {
            console.error("Error generating cover letter:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            throw new Error("Failed to generate cover letter");
        }
    }
}
