import { ScrapeResult } from "@/components/Forms/JobDescription";
import { ResumeData } from "@/types/types";
import { LocalResumeService } from "./localResumeService";
import { NextResponse } from "next/server";
// import { LocalResumeService } from "./localResumeService";

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

    static async getSingle(resumeId: string) {
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

    static async getAll(userId: string | null) {
        try {
            const response = await fetch(`/api/resume/all?id=${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            return response
        } catch (error) {
            throw error
        }
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

    static async uploadResume(file: File, userId?: string) {
        try {
            const text = await extractTextFromPdf(file)
            const respone = await fetch('/api/ai/extract-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await respone.json();
            if (!respone.ok) {
                throw new Error(data.error || 'Failed to extract resume data.');
            }

            if (!userId) {
                const saveLocal = await LocalResumeService.create(data.data)
                // console.log(saveLocal)
                return NextResponse.json({ data: saveLocal }, { status: 200 })
            }

            const resumeId = self.crypto.randomUUID();
            const saveResume = await ResumeService.save(userId, resumeId, 'modern', data.data);
            return saveResume
        } catch (error) {
            throw error
        }
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

export async function analyzeResume(resumeId: string, jobDescription: string, updateTitle?: boolean) {
    try {
        const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeId, jobDescription, updateTitle })
        });
        const data = await response.json();
        if (!response.ok) {
            return { status: response.status, error: data.error || 'Failed to analyze resume' };
        }
        return { status: 200, ...data };
    } catch (error) {
        return { status: 500, error: (error as Error).message };
    }
}

export async function getJobDescription(url: string | string[]) {
    const urls = Array.isArray(url) ? url : [url];
    const valid = urls.filter(u => /^https?:\/\//i.test(u));
    if (!valid.length) {
        return { status: 400, message: 'No valid URL(s) provided' };
    }
    try {
        const response = await fetch('/api/scrape-job', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: valid })
        });
        const data = await response.json();
        if (!response.ok) {
            return { status: response.status, message: data.error || 'Failed to scrape' };
        }
        // Pick first successful description
        interface ScrapeResult { success: boolean; description?: string }
        const first = (data.results as ScrapeResult[] | undefined)?.find(r => r.success && r.description);
        const allBlocked = !first && Array.isArray(data.results) && (data.results as { error?: string }[]).every(r => r?.error === 'blocked_or_challenge');
        return {
            status: 200,
            description: first?.description || '',
            raw: data.results,
            meta: data.meta,
            blocked: allBlocked,
            message: allBlocked ? 'The site blocked automated extraction. Please copy & paste the description manually.' : undefined
        };
    } catch (error) {
        return { status: 500, message: (error as Error).message };
    }
}

const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Use jsDelivr for the worker source (make sure the version matches your installed pdfjs-dist)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/+esm`;

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read file.'));
            }
            try {
                const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text +=
                        content.items
                        .map((item) => ('str' in item ? item.str : ''))
                            .join(' ') + '\n';
                }
                resolve(text);
            } catch (error) {
                console.error('Error parsing PDF:', error);
                reject(new Error('Could not parse the PDF file.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Error reading file.'));
        };
        reader.readAsArrayBuffer(file);
    });
};