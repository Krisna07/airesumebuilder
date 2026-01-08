
import { ScrapeResult } from "@/components/Forms/JobDescription";
import { JobDescription, ResumeData } from "@/types/types";
import { LocalResumeService } from "./localResumeService";
import { NextResponse } from "next/server";
import { extractTextFromPdf } from "@/utils/pdfExtractor";

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

    static async regenerate(resumeData: ResumeData, jobDescription?: ScrapeResult) {
        try {
            const response = await fetch('/api/ai/generate-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume: resumeData,
                    jobDescription: jobDescription
                })
            });
            return response
        } catch (error) {
            throw error
        }

    }
}

export async function uploadResume(file: File, userId?: string) {
    try {
        const text = await extractTextFromPdf(file)
        // console.log(text)
        if (!text || text.trim().length === 0) {
            throw new Error('No text extracted from PDF.');
        }
        const structuredData: ResumeData = await fetch('/api/ai/extract-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        }).then(res => res.json()).then(data => data.data);

        if (!structuredData) {
            throw new Error('Failed to process resume data');
            }

            if (!userId) {
                const saveLocal = await LocalResumeService.create(structuredData)
                return NextResponse.json({ data: saveLocal }, { status: 200 })
            }

            const resumeId = self.crypto.randomUUID();
        const saveResume = await ResumeService.save(userId, resumeId, 'modern', structuredData);
            return saveResume
        } catch (error) {
            throw error
        }
    }

type analyzeResumeParams = {
    resumeId: string;
    jobDetails?: JobDescription;
    jobDescriptionId?: string
}
export async function analyzeResume(analyzeResumeParams: analyzeResumeParams) {
    try {
        const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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



