import { ScrapeResult } from "@/components/Forms/JobDescription";
import { AnalysisResult, JobDescription, ResumeData } from "@/types/types";
import { extractTextFromPdfFile } from "@/utils/resumeExtractor";
import { LocalResumeService } from "./localResumeService";

type analyzeResumeParams = {
    resumeId: string;
    jobDetails?: JobDescription;
    jobDescriptionId?: string
}

export class ResumeService {
    static async save(userId: string, resumeId: string, template: string, resumeData: ResumeData) {
        try {
            const response = await fetch('/api/resume', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...resumeData,
                    id: resumeId,
                    userId: userId,
                    template: template
                })
            })
            return response
        } catch (error) {
            throw error
        }
    }

    static async getSingle(resumeId: string): Promise<Response> {
        try {
            const response = await fetch(`/api/resume?id=${resumeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            return response
        } catch (error) {
            throw error
        }
    }

    static async delete(resumeId: string) {
        try {
            const response = await fetch(`/api/resume?id=${resumeId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })
            return response
        } catch (error) {
            throw error
        }
    }

    static async getAll(userId: string | null): Promise<ResumeData[]> {
        if (!userId) {
            throw new Error('User ID is required to fetch resumes');
        }
        const response = await fetch(`/api/resume/all?id=${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
        if (!response.ok) {
            throw new Error('Failed to fetch resumes');
        }
        const data = await response.json();
        return data.data;
    }

    static async create(userId: string, template?: string, data?: Partial<ResumeData>) {
        const resumeId = crypto.randomUUID();
        const selectedTemplate = template || 'Classic';
        const emptyData: ResumeData = {
            id: resumeId,
            userId: userId,
            template: selectedTemplate,
            title: 'Untitled Resume',
            profile: {
                fullname: '',
                email: '',
                phone: '',
                location: '',
                links: [],
                summary: ''
            },
            skills: [
                {
                    type: '',
                    skills: []
                }
            ],
            experiences: [
                {
                    title: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    responsibilities: []
                }
            ],
            educations: [
                {
                    degree: '',
                    university: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    location: ''
                }
            ],
            customSections: [],
            ...data
        };
        const response = await this.save(userId, resumeId, selectedTemplate, emptyData);
        return response
    }

    static async regenerate(resumeData: ResumeData, jobDescription?: ScrapeResult, analysis?: AnalysisResult): Promise<Response> {
        try {
            const response = await fetch('/api/ai/generate-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    resume: resumeData,
                    jobDescription: jobDescription,
                    analysis: analysis
                })
            });
            return response
        } catch (error) {
            throw error
        }

    }

    static async getRegenerateStatus(resumeId: string): Promise<Response> {
        try {
            const response = await fetch(`/api/ai/generate-resume?resumeId=${encodeURIComponent(resumeId)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export async function uploadResume(
    file: File,
    userId?: string,
    onProgress?: (message: string) => void
) {
    try {
        // Step 1: Extract text client-side with unpdf (fast!)
        onProgress?.('Extracting text from PDF...');

        const rawText = await extractTextFromPdfFile(file, onProgress);

        if (!rawText || rawText.trim().length === 0) {
            throw new Error('No text extracted from PDF.');
        }

        // Step 2: Parse with server-side AI (reliable)
        onProgress?.('Parsing resume with AI...');

        const endpoint = userId ? '/api/ai/extract-resume' : '/api/ai/extract-resume-guest';

        const extractResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text: rawText })
        });

        const extractBody = await extractResponse.json();

        if (!extractResponse.ok) {
            throw new Error(extractBody?.error || extractBody?.details || 'Failed to extract resume data');
        }

        const structuredData: ResumeData = extractBody?.data;

        if (!structuredData) {
            throw new Error('Failed to process resume data');
        }

        onProgress?.('Resume parsed successfully');

        // Save the resume
        if (!userId) {
            const saveLocal = await LocalResumeService.create('classic', structuredData);
            return new Response(JSON.stringify({ data: saveLocal }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const resumeId = crypto.randomUUID();
        const saveResume = await ResumeService.save(userId, resumeId, 'modern', structuredData);
        return saveResume;
    } catch (error) {
        throw error;
    }
}

/**
 * Parse experience section from extracted text
 */
function parseExperienceSection(experienceText: string) {
    const experiences: ResumeData['experiences'] = [];
    const lines = experienceText.split('\n').filter(l => l.trim());

    let currentExp: {
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
        responsibilities: string[];
    } | null = null;

    for (const line of lines) {
        // Simple heuristic: if line contains date patterns, start new experience
        if (/\d{4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line)) {
            if (currentExp) experiences.push(currentExp);
            currentExp = {
                title: line,
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                responsibilities: []
            };
        } else if (currentExp) {
            if (!currentExp.responsibilities) {
                currentExp.responsibilities = [];
            }
            currentExp.responsibilities.push(line);
        }
    }

    if (currentExp) experiences.push(currentExp);

    return experiences.length > 0 ? experiences : [{
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: []
    }];
}

/**
 * Parse education section from extracted text
 */
function parseEducationSection(educationText: string) {
    const educations: ResumeData['educations'] = [];
    const lines = educationText.split('\n').filter(l => l.trim());

    for (const line of lines) {
        if (/\d{4}|university|college|bachelor|master|phd|degree/i.test(line)) {
            educations.push({
                degree: line,
                university: '',
                startDate: '',
                endDate: '',
                current: false,
                location: ''
            });
        }
    }

    return educations.length > 0 ? educations : [{
        degree: '',
        university: '',
        startDate: '',
        endDate: '',
        current: false,
        location: ''
    }];
}

export async function analyzeResume(analyzeResumeParams: analyzeResumeParams) {
    try {
        const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ analyzeResumeParams })
        });
        const data = await response.json();

        if (!response.ok) {
            return { status: response.status, error: data.error || 'Failed to analyze resume' };
        }
        return {
            status: 200,
            ...data
        };
    } catch (error) {
        return { status: 500, error: (error as Error).message };
    }
}