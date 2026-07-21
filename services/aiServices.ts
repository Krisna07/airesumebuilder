/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnalysisResult, CoverLetterResponse, JobDescription, ResumeData } from "@/types/types";
import {
    resumeGenerationPrompt,
    resumeExtractionPrompt,
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
import { captureServerError } from "@/lib/monitoring/server";
import { callAI } from "@/services/aiProviderOrchestrator";
import { extractResumeFromText, cleanResumeText } from "@/services/textResumeExtractor";

const EXTRACTION_NOISE_PATTERNS: RegExp[] = [
    /let'?s\s+start\s+with\s+your\s+details/i,
    /provide\s+essential\s+information\s+to\s+proceed/i,
    /\b(full\s*name|email|phone|location|summary)\*?\b/i,
    /\bsave\s+profile\b/i,
    /\bregenerate\b/i,
];

function getSectionGenerationSchema(sectionKey: 'summary' | 'experience' | 'education' | 'skills' | 'customSections' | string) {
    switch (sectionKey) {
        case 'summary':
            return {
                type: 'object',
                additionalProperties: false,
                properties: {
                    profile: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            summary: { type: 'string' },
                        },
                        required: ['summary'],
                    },
                },
                required: ['profile'],
            };
        case 'experience':
            return {
                type: 'object',
                additionalProperties: false,
                properties: {
                    experiences: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                title: { type: 'string' },
                                company: { type: 'string' },
                                location: { type: 'string' },
                                startDate: { type: 'string' },
                                endDate: { type: 'string' },
                                current: { type: 'boolean' },
                                responsibilities: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                            },
                            required: ['title', 'company', 'location', 'startDate', 'responsibilities'],
                        },
                    },
                },
                required: ['experiences'],
            };
        case 'education':
            return {
                type: 'object',
                additionalProperties: false,
                properties: {
                    educations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                degree: { type: 'string' },
                                university: { type: 'string' },
                                location: { type: 'string' },
                                startDate: { type: 'string' },
                                endDate: { type: 'string' },
                                current: { type: 'boolean' },
                            },
                            required: ['degree', 'university', 'location', 'startDate'],
                        },
                    },
                },
                required: ['educations'],
            };
        case 'skills':
            return {
                type: 'object',
                additionalProperties: false,
                properties: {
                    skills: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                type: { type: 'string' },
                                skills: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                            },
                            required: ['type', 'skills'],
                        },
                    },
                },
                required: ['skills'],
            };
        case 'customSections':
            return {
                type: 'object',
                additionalProperties: false,
                properties: {
                    customSections: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                title: { type: 'string' },
                                subsections: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            title: { type: 'string' },
                                            content: { type: 'string' },
                                            date: { type: 'string' },
                                        },
                                        required: ['title', 'content'],
                                    },
                                },
                            },
                            required: ['title', 'subsections'],
                        },
                    },
                },
                required: ['customSections'],
            };
        default:
            return undefined;
    }
}

function hasExtractionNoise(value: string | undefined): boolean {
    if (!value) return false;
    return EXTRACTION_NOISE_PATTERNS.some((pattern) => pattern.test(value));
}

function hasSuspiciousResumeNoise(data: ResumeData): boolean {
    const fullname = data.profile?.fullname || '';
    const summary = data.profile?.summary || '';
    const combined = `${fullname}\n${summary}`;
    return hasExtractionNoise(combined);
}

/**
 * Unified AI call - Uses multi-provider orchestrator with intelligent fallback
 * Priority: Groq → HuggingFace (if healthy) → OpenRouter → TextExtractor
 * @param prompt - The prompt to send
 * @param outputSchema - Optional JSON schema for structured output
 * @param taskType - Optional task type for logging (e.g., 'resume-generation', 'resume-analysis')
 * @returns Parsed JSON response
 */
async function callAIWithSchema(
    prompt: string,
    outputSchema?: any,
    taskType?: string
): Promise<any> {
    console.log(`Starting AI call${taskType ? ` for task: ${taskType}` : ''}...`);

    try {
        const response = await callAI({
            prompt,
            schema: outputSchema,
            taskType,
        });

        // Parse response if JSON expected
        if (outputSchema) {
            try {
                return JSON.parse(response);
            } catch {
                return response; // Return as-is if not JSON
            }
        }

        return response;
    } catch (error: any) {
        console.error(`AI call failed for ${taskType || 'unknown'}:`, error?.message);
        await captureServerError(error, {
            source: 'AIService.callAIWithSchema',
            severity: 'critical',
            tags: ['ai', 'orchestrator-failure'],
            extra: { taskType },
        });
        throw error;
    }
}

/**
 * Public export of callAIWithSchema for use outside this module
 */
export { callAIWithSchema }

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
        const sectionSchema = getSectionGenerationSchema(sectionKey);

        try {
            const response = await callAIWithSchema(prompt, sectionSchema, 'section-generation');

            if (sectionKey === 'summary') {
                if (typeof response?.profile?.summary !== 'string') {
                    throw new Error('Invalid summary section returned');
                }
            } else if (sectionKey === 'experience') {
                if (!Array.isArray(response?.experiences)) {
                    throw new Error('Invalid experience section returned');
                }
            } else if (sectionKey === 'education') {
                if (!Array.isArray(response?.educations)) {
                    throw new Error('Invalid education section returned');
                }
            } else if (sectionKey === 'skills') {
                if (!Array.isArray(response?.skills)) {
                    throw new Error('Invalid skills section returned');
                }
            } else if (sectionKey === 'customSections') {
                if (!Array.isArray(response?.customSections)) {
                    throw new Error('Invalid custom sections returned');
                }
            }

            return response;
        } catch (error: any) {
            console.error("Error generating section:", error?.message || error);
            throw new Error(`Failed to generate ${sectionKey} section`);
        }
    }

    /**
     * Generate a complete optimized resume
    * Uses orchestrator for AI extraction (Groq → HF → OpenRouter → Fallback)
    * Falls back to advanced pattern-based extraction if AI service fails
     */
    static async generateResume(
        userdata?: ResumeData,
        data?: string,
        jobDescription?: string,
        customPrompt?: string
    ): Promise<ResumeData> {
        const prompt = userdata
            ? resumeGenerationPrompt(userdata, jobDescription || '', undefined, customPrompt)
            : resumeExtractionPrompt(data || '');

        try {
            // If data is provided (resume extraction), use extraction model
            const taskType = data && !userdata ? 'resume-extraction' : 'resume-generation';
            const response = await callAIWithSchema(prompt, resumeGenerationSchema, taskType);

            if (!isValidResumeData(response)) {
                throw new Error('Invalid resume data structure returned');
            }

            if (data && !userdata && hasSuspiciousResumeNoise(response as ResumeData)) {
                throw new Error('AI extraction returned form-label noise; retrying with deterministic extractor');
            }

            console.log('Resume generated successfully with AI');
            return response as ResumeData;
        } catch (aiError: any) {
            console.error("AI Resume generation failed:", aiError?.message || aiError);

            // Fallback: Use advanced pattern-based extractor if we have raw text
            if (data && typeof data === 'string' && data.trim().length > 50) {
                try {
                    console.warn('Falling back to advanced pattern-based extraction...');
                    const cleanedText = cleanResumeText(data);
                    const extractedResume = extractResumeFromText(
                        cleanedText,
                        userdata?.userId || 'unknown',
                        userdata?.title || 'Resume'
                    );

                    console.log('Resume extracted successfully using advanced pattern-based extractor');
                    return extractedResume;
                } catch (extractError: any) {
                    console.error("Advanced extractor fallback also failed:", extractError?.message);
                }
            }

            // If we have structured data, try to enhance it
            if (userdata) {
                console.warn('Using partial structured data as fallback');
                return userdata;
            }

            await captureServerError(aiError, {
                source: 'AIService.generateResume',
                severity: 'critical',
                tags: ['ai', 'resume-generation', 'fallback-failed'],
            });
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
     * Falls back to keyword-based analysis if AI fails
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
        } catch (aiError: any) {
            console.error("AI analysis failed:", aiError?.message || aiError);

            // Fallback: Basic keyword-based analysis
            try {
                console.warn('Falling back to keyword-based analysis...');
                const fallbackAnalysis = this.analyzeResumeBasic(resumeData, jobDescription);
                console.log('Analysis completed using fallback');
                return fallbackAnalysis;
            } catch (fallbackError: any) {
                console.error("Fallback analysis also failed:", fallbackError?.message);
                await captureServerError(aiError, {
                    source: 'AIService.analyzeResume',
                    severity: 'error',
                    tags: ['ai', 'resume-analysis', 'fallback-failed'],
                });
                throw new Error("Failed to analyze resume");
            }
        }
    }

    /**
     * Fallback basic analysis using keyword matching
     */
    private static analyzeResumeBasic(resumeData: ResumeData, jobDescription: string): AnalysisResult {
        const resumeText = JSON.stringify(resumeData).toLowerCase();
        const jdText = jobDescription.toLowerCase();

        // Extract keywords from job description
        const jdKeywords = jdText.match(/\b[a-z]{4,}\b/g) || [];
        const uniqueKeywords = Array.from(new Set(jdKeywords));

        // Count matching keywords
        let matchCount = 0;
        const missingKeywords: string[] = [];

        for (const keyword of uniqueKeywords.slice(0, 30)) {
            // Top 30 keywords
            if (resumeText.includes(keyword)) {
                matchCount++;
            } else {
                missingKeywords.push(keyword);
            }
        }

        // Calculate matching percentage
        const matchingPercentage = uniqueKeywords.length > 0 ? Math.round((matchCount / uniqueKeywords.length) * 100) : 50;

        // Extract strengths (matched keywords)
        const strengths = uniqueKeywords
            .filter((k) => resumeText.includes(k))
            .slice(0, 5);

        return {
            id: '',
            jobDescription: jobDescription.substring(0, 500),
            description: `Resume analyzed using keyword matching. ${matchCount} out of ${uniqueKeywords.length} key job description terms found in resume.`,
            matchingPercentage: Math.max(20, Math.min(100, matchingPercentage)), // Between 20-100
            suggestions: [
                missingKeywords.length > 0
                    ? `Consider adding these missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`
                    : 'Resume contains strong keyword alignment with job description',
                'Review your accomplishments to highlight relevant achievements',
                'Ensure all relevant skills are clearly listed in the skills section',
            ],
            strengths: strengths,
            missingKeywords: missingKeywords.slice(0, 10),
        };
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
    * Uses strong OpenRouter long-context tier
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
