/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnalysisResult, CoverLetterResponse, JobDescription, ResumeData } from "@/types/types";
import {
    resumeGenerationPrompt,
    analyzeResumeToJobFitPrompt,
    coverLetterPrompt,
    smartRecommendationPrompt,
    extractJobDetailsPrompt,
    generateSectionPrompt,
    inspectIntentPrompt
} from "@/lib/prompts";
import {
    resumeGenerationSchema,
    resumeAnalysisSchema,
    coverLetterSchema,
    jobExtractionSchema,
    smartRecommendationsSchema,
    intentInspectionSchema,
    urlMetadataSchema,
    isValidResumeData,
    isValidAnalysisResult,
    isValidCoverLetter
} from "@/lib/aiSchemas";
import { callGeminiModel } from "@/services/geminiService";
import { callOpenRouterModel } from "@/services/openRouterService";
import { geminiModels, MODEL_ROUTING, openRouterModels } from "@/services/aiModelConfig";

const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

if (!hasOpenRouterKey && !hasGeminiKey) {
    console.warn('AIService: No API keys found for Gemini or OpenRouter. AI functionalities will be disabled.');
}

/**
 * Call a specific Gemini model with schema
 */
async function callSpecificGeminiModel(
    model: string,
    prompt: string,
    outputSchema?: any
): Promise<any> {
    if (!hasGeminiKey) {
        throw new Error('Gemini client not available');
    }

    return callGeminiModel({
        model,
        prompt,
        outputSchema,
    });
}

/**
 * Call a specific OpenRouter model with schema
 */
async function callSpecificOpenRouterModel(
    model: string,
    prompt: string,
    outputSchema?: any
): Promise<any> {
    if (!hasOpenRouterKey) {
        throw new Error('OpenRouter client is not initialized');
    }

    return callOpenRouterModel({
        model,
        prompt,
        outputSchema,
    });
}
/**
 * Call Gemini AI with structured output schema
 * @param prompt - The prompt to send
 * @param outputSchema - Optional JSON schema for structured output
 * @param retries - Number of retries (3 = try all 3 Gemini models)
 * @returns Parsed response or raw string
 */
async function callGeminiWithSchema(
    prompt: string,
    outputSchema?: any,
    retries = 3
): Promise<any> {
    if (retries <= 0 || !hasGeminiKey) {
        throw new Error('Gemini client not available or retries exhausted');
    }

    const modelIndex = 3 - retries;
    const model = geminiModels[modelIndex] || geminiModels[0];

    try {
        return await callSpecificGeminiModel(model, prompt, outputSchema);
    } catch (error: any) {
        console.warn(
            `Gemini call failed with ${model} (attempt ${4 - retries}/3):`,
            error?.message || error
        );

        if (retries > 1) {
            return callGeminiWithSchema(prompt, outputSchema, retries - 1);
        }

        throw error;
    }
}

/**
 * Call OpenRouter AI with structured output schema
 * @param prompt - The prompt to send
 * @param outputSchema - Optional JSON schema for structured output
 * @param retries - Number of retries (3 = try all 3 OpenRouter models)
 * @returns Parsed response or raw string
 */
async function callOpenRouterWithSchema(
    prompt: string,
    outputSchema?: any,
    retries = 3
): Promise<any> {
    if (!hasOpenRouterKey) {
        throw new Error('OpenRouter client is not initialized.');
    }

    const modelIndex = 3 - retries;
    const model = openRouterModels[modelIndex] || openRouterModels[0];

    try {
        console.log(`Calling OpenRouter with ${model} (attempt ${4 - retries}/3)`);
        return await callSpecificOpenRouterModel(model, prompt, outputSchema);
    } catch (error: any) {
        console.warn(
            `OpenRouter call failed with ${model} (attempt ${4 - retries}/3):`,
            error?.message || error
        );

        if (retries > 1) {
            return callOpenRouterWithSchema(prompt, outputSchema, retries - 1);
        }

        throw error;
    }
}

/**
 * Unified AI call with automatic fallback from Gemini to OpenRouter
 * Supports model routing for specific tasks
 * @param prompt - The prompt to send
 * @param outputSchema - Optional JSON schema for structured output
 * @param taskType - Optional task type for model routing (e.g., 'resume-generation', 'resume-analysis')
 * @returns Parsed response
 */
async function callAIWithSchema(
    prompt: string,
    outputSchema?: any,
    taskType?: string
): Promise<any> {
    console.log(`Starting AI call${taskType ? ` for task: ${taskType}` : ''}...`);

    // Try preferred models first if task type is specified
    if (taskType && MODEL_ROUTING[taskType]) {
        const preferredModels = MODEL_ROUTING[taskType];
        console.log(`Trying ${preferredModels.length} preferred model(s) for ${taskType}...`);

        for (const { provider, model } of preferredModels) {
            try {
                console.log(`Attempting preferred ${provider} model: ${model}`);

                if (provider === 'gemini' && hasGeminiKey) {
                    return await callSpecificGeminiModel(model, prompt, outputSchema);
                } else if (provider === 'openrouter' && hasOpenRouterKey) {
                    return await callSpecificOpenRouterModel(model, prompt, outputSchema);
                }
            } catch (error: any) {
                console.warn(
                    `Preferred ${provider} model ${model} failed:`,
                    error?.message || error
                );
                // Continue to next preferred model or fall back to waterfall
            }
        }

        console.log('All preferred models failed, falling back to standard waterfall...');
    }

    // Standard waterfall: Try Gemini first (3 models)
    if (hasGeminiKey) {
        try {
            console.log('Attempting Gemini models...');
            return await callGeminiWithSchema(prompt, outputSchema, 3);
        } catch (geminiError: any) {
            console.warn('All Gemini models failed, falling back to OpenRouter:', geminiError?.message);
        }
    }

    // Fallback to OpenRouter (3 models)
    if (hasOpenRouterKey) {
        try {
            console.log('Attempting OpenRouter models...');
            return await callOpenRouterWithSchema(prompt, outputSchema, 3);
        } catch (openRouterError: any) {
            console.error('All OpenRouter models failed:', openRouterError?.message);
            throw new Error(`AI service exhausted all providers: ${openRouterError?.message || 'Unknown error'}`);
        }
    }

    throw new Error('No AI providers available. Check GEMINI_API_KEY or OPENROUTER_API_KEY.');
}
export class AIService {

    /**
     * Generate a specific section of a resume
     * Uses specialized model: openrouter/owl-alpha
     */
    static async generateSection(
        sectionKey: 'summary' | 'experience' | 'education' | 'skills' | 'customSections' | string,
        resumeData: ResumeData,
        jobDescription?: string
    ): Promise<Partial<ResumeData>> {
        const prompt = generateSectionPrompt(sectionKey, resumeData, jobDescription);

        try {
            const response = await callAIWithSchema(prompt, resumeGenerationSchema, 'section-generation');

            if (!isValidResumeData(response)) {
                throw new Error('Invalid resume data structure returned');
            }

            return response;
        } catch (error: any) {
            console.error("Error generating section:", error?.message || error);
            throw new Error(`Failed to generate ${sectionKey} section`);
        }
    }

    /**
     * Generate a complete optimized resume
     * Uses fast model: gemini-3.1-flash-lite-preview
     */
    static async generateResume(
        userdata?: ResumeData,
        data?: string,
        jobDescription?: string
    ): Promise<ResumeData> {
        const sourceResume = userdata
            ? JSON.stringify(userdata)
            : JSON.stringify({ raw: data });

        const prompt = resumeGenerationPrompt(
            JSON.parse(sourceResume) as ResumeData,
            jobDescription || ''
        );

        try {
            // If data is provided (resume extraction), use extraction model
            const taskType = data && !userdata ? 'resume-extraction' : 'resume-generation';
            const response = await callAIWithSchema(prompt, resumeGenerationSchema, taskType);

            if (!isValidResumeData(response)) {
                throw new Error('Invalid resume data structure returned');
            }

            console.log('Resume generated successfully');
            return response as ResumeData;
        } catch (error: any) {
            console.error("Error generating resume:", error?.message || error);
            throw new Error("Failed to generate resume");
        }
    }

    /**
     * Extract job metadata from raw text
     * Uses specialized model: openrouter/owl-alpha
     */
    static async extractJobMetadata(rawText: string): Promise<{
        title: string;
        company: string;
        location: string;
        domain: string;
        description: string;
    }> {
        const prompt = extractJobDetailsPrompt(rawText);

        try {
            const response = await callAIWithSchema(prompt, jobExtractionSchema, 'job-extraction');

            // Validate required fields
            if (!response.title || !response.company || !response.location || !response.domain || !response.description) {
                throw new Error('Missing required job metadata fields');
            }

            return response;
        } catch (error: any) {
            console.error("Error extracting job metadata:", error?.message || error);
            throw new Error("Failed to extract job metadata");
        }
    }

    /**
     * Analyze resume fit against job description
     * Uses reasoning model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
     */
    static async analyzeResume(
        resumeData: ResumeData,
        jobDescription: string
    ): Promise<AnalysisResult> {
        const prompt = analyzeResumeToJobFitPrompt(resumeData, jobDescription);

        try {
            const response = await callAIWithSchema(prompt, resumeAnalysisSchema, 'resume-analysis');

            if (!isValidAnalysisResult(response)) {
                throw new Error('Invalid analysis result structure returned');
            }

            // Ensure matchingPercentage is within bounds
            response.matchingPercentage = Math.max(
                0,
                Math.min(100, Math.round(response.matchingPercentage))
            );

            return response as AnalysisResult;
        } catch (error: any) {
            console.error("Error analyzing resume:", error?.message || error);
            throw new Error("Failed to analyze resume");
        }
    }

    /**
     * Extract metadata from a URL
     */
    static async extractUrlData(url: string): Promise<{
        title: string;
        description: string;
        image: string;
        keywords: string[];
    }> {
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
            const response = await callAIWithSchema(prompt, urlMetadataSchema);
            return response;
        } catch (error: any) {
            console.error("Error extracting URL data:", error?.message || error);
            throw new Error("Failed to extract URL data");
        }
    }

    /**
     * Generate a cover letter
     * Uses fast model: gemini-3.1-flash-lite-preview
     */
    static async generateCoverLetter(
        resumeData: ResumeData,
        jobDescription: JobDescription,
        analysis?: AnalysisResult
    ): Promise<{
        parsed: CoverLetterResponse;
        jobTitle: string;
        companyName: string;
        location: string;
        userDetails: any;
    }> {
        try {
            const sourceResume = resumeData
                ? JSON.stringify(resumeData)
                : JSON.stringify({ raw: resumeData });

            const prompt = coverLetterPrompt(
                JSON.parse(sourceResume) as ResumeData,
                jobDescription,
                analysis
            );

            const response = await callAIWithSchema(prompt, coverLetterSchema, 'cover-letter');

            if (!isValidCoverLetter(response)) {
                throw new Error('Invalid cover letter structure returned');
            }

            return {
                parsed: response as CoverLetterResponse,
                jobTitle: jobDescription.title,
                companyName: jobDescription.company,
                location: jobDescription.location,
                userDetails: resumeData.profile
            };
        } catch (error: any) {
            console.error("Error generating cover letter:", error?.message || error);
            throw new Error("Failed to generate cover letter");
        }
    }

    /**
     * Get smart recommendations for resume bullets
     */
    static async getSmartRecommendations(
        title: string,
        seniority: string,
        specialization: string,
        existingBullets: string[]
    ): Promise<string[]> {
        const prompt = smartRecommendationPrompt(title, seniority, specialization, existingBullets);

        try {
            const response = await callAIWithSchema(prompt, smartRecommendationsSchema);

            if (!response.recommendations || !Array.isArray(response.recommendations)) {
                console.warn('Invalid recommendations structure, returning empty array');
                return [];
            }

            return response.recommendations.filter((r: any) => typeof r === 'string');
        } catch (error: any) {
            console.error("Error getting smart recommendations:", error?.message || error);
            return [];
        }
    }

    /**
     * Inspect user intent for resume bullet
     */
    static async inspectIntent(
        title: string,
        seniority: string,
        specialization: string,
        intent: string,
        existingBullets: string[]
    ): Promise<{
        tasks: string[];
        notes: string | null;
        recommendations: string[];
    }> {
        const prompt = inspectIntentPrompt(title, seniority, specialization, intent, existingBullets);

        try {
            const response = await callAIWithSchema(prompt, intentInspectionSchema);

            const tasks = Array.isArray(response?.tasks)
                ? response.tasks.filter((t: any) => typeof t === 'string')
                : [];
            const notes = typeof response?.notes === 'string' ? response.notes : null;
            const recommendations = Array.isArray(response?.recommendations)
                ? response.recommendations.filter((r: any) => typeof r === 'string')
                : [];

            return { tasks, notes, recommendations };
        } catch (error: any) {
            console.error('Error inspecting intent:', error?.message || error);
            return { tasks: [], notes: null, recommendations: [] };
        }
    }
}
