/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { AnalysisResult, CoverLetterResponse, JobDescription, ResumeData } from "@/types/types";
import { resumeGenerationPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt, smartRecommendationPrompt, extractJobDetailsPrompt, generateSectionPrompt } from "@/lib/prompts";
import { inspectIntentPrompt } from "@/lib/prompts";
import { parseResponse } from "@/lib/jsonParse";
import { OpenRouter } from '@openrouter/sdk';

const openRouterKey = process.env.OPENROUTER_API_KEY;
const api = process.env.GEMINI_API_KEY;

if (!openRouterKey && !api) {
    console.warn('AIService: No API keys found for Gemini or OpenRouter. AI functionalities will be disabled.');
}
const openRouter = new OpenRouter({ apiKey: openRouterKey });

const genAI = new GoogleGenAI({ apiKey: api });

const aiModel = 'gemini-3.1-flash-lite-preview';
const fallBackModel = 'gemma-3-27b-it';

function coerceArrayStrings(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
    return [];
}
async function callAIWithRetry(prompt: string, retries = 3): Promise<string> {
    console.log(`Calling AI (Attempt ${4 - retries}, Model Waterfall)`);

    if (!genAI && !openRouter) {
        throw new Error('AI clients are not initialized. Check GEMINI_API_KEY or OPENROUTER_API_KEY.');
    }

    try {
        if (retries === 0) {
            return await callOpenRouterAI(prompt);
        }

        let modelToUse = aiModel;
        if (retries === 2) modelToUse = fallBackModel;
        if (retries === 1) modelToUse = 'gemini-3.1-flash';

        if (!genAI) throw new Error('Gemini client not available');

        const response: GenerateContentResponse = await genAI.models.generateContent({
            model: modelToUse,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const candidate = response?.candidates?.[0];
        const content = candidate?.content;
        const raw = content?.parts?.map((part: any) => part.text).join('') || '';

        if (!raw) {
            throw new Error('Empty response from Gemini');
        }

        return raw;

    } catch (error: any) {
        if (retries > 0) {
            console.warn(`Gemini call failed (attempt ${4 - retries}), switching/retrying...`, error?.message || error);
            return callAIWithRetry(prompt, retries - 1);
        }
        throw error;
    }
}

async function callOpenRouterAI(prompt: string, retries = 3): Promise<string> {
    console.log(`Calling OpenRouter AI (Attempt ${4 - retries})`);
    if (!openRouter) {
        throw new Error('OpenRouter client is not initialized.');
    }

    try {
        const modelSequence = [
            'google/gemini-3.1-flash-lite-001:free',
            'mistralai/mistral-small-24b-instruct-2501:free',
            'meta-llama/llama-3.3-70b-instruct:free'
        ];

        const modelToUse = modelSequence[3 - retries] || modelSequence[0];

        const response = await openRouter.chat.send({
            model: modelToUse,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
        });

        const choice = response?.choices?.[0];
        const content = choice?.message?.content;

        if (!content) {
            throw new Error('Empty response from OpenRouter');
        }

        if (typeof content !== 'string') {
            return JSON.stringify(content);
        }

        return content;

    } catch (error: any) {
        if (retries > 1) {
            console.warn(`OpenRouter call failed, retrying...`, error?.message || error);
            return callOpenRouterAI(prompt, retries - 1);
        }
        throw new Error(`AI service exhausted all providers: ${error?.message || 'Unknown error'}`);
    }
}
export class AIService {

    static async generateSection(
        sectionKey: 'summary' | 'experience' | 'education' | 'skills' | 'customSections' | string,
        resumeData: ResumeData,
        jobDescription?: string
    ): Promise<Partial<ResumeData>> {
        const prompt = generateSectionPrompt(sectionKey, resumeData, jobDescription);
        const response = await callAIWithRetry(prompt);
        const parsed = parseResponse(response) as Partial<ResumeData>;
        return parsed;
    }

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
            const response = await callAIWithRetry(prompt);
            const raw = response;
            const parsed = parseResponse(raw as string);
            console.log(parsed)
            return parsed as ResumeData;
        } catch (error) {

            console.error("Error generating resume:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            throw new Error("Failed to generate resume");

        }
    }

    static async extractJobMetadata(rawText: string) {
        const prompt = extractJobDetailsPrompt(rawText);
        try {
            const response = await callAIWithRetry(prompt);
            const parsed = parseResponse(response);
            return parsed as {
                title: string;
                company: string;
                location: string;
                domain: string;
                description: string;
            };
        } catch (error) {
            console.error("Error extracting job metadata:", error);
            throw new Error("Failed to extract job metadata");
        }
    }

    static async analyzeResume(resumeData: ResumeData, jobDescription: string) {
        // Build prompt using the specialized analyze prompt (caps tokens by slicing arrays internally)
        const prompt = analyzeResumeToJobFitPrompt(resumeData, jobDescription);
        try {
            const response = await callAIWithRetry(prompt);
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
            const raw = await callAIWithRetry(prompt);
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
            const response = await callAIWithRetry(prompt);
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

    static async getSmartRecommendations(title: string, seniority: string, specialization: string, existingBullets: string[]) {
        const prompt = smartRecommendationPrompt(title, seniority, specialization, existingBullets);
        try {
            const response = await callAIWithRetry(prompt);
            const raw = response;
            const parsed = parseResponse(raw as string) as any;
            return (parsed?.recommendations || []) as string[];
        } catch (error) {
            console.error("Error getting smart recommendations:", error);
            return [];
        }
    }

    static async inspectIntent(title: string, seniority: string, specialization: string, intent: string, existingBullets: string[]) {
        const prompt = inspectIntentPrompt(title, seniority, specialization, intent, existingBullets);
        try {
            const response = await callAIWithRetry(prompt);
            const raw = response as string;
            const parsed = parseResponse(raw) as any;
            const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks.filter((t: any) => typeof t === 'string') : [];
            const notes = typeof parsed?.notes === 'string' ? parsed.notes : null;
            const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations.filter((r: any) => typeof r === 'string') : [];
            return { tasks, notes, recommendations };
        } catch (error) {
            console.error('Error inspecting intent in AIService:', error);
            return { tasks: [], notes: null, recommendations: [] };
        }
    }
}
