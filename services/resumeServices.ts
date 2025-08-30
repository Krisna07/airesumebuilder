import { ResumeData } from "@/types/types";

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
            certificates: [
                {
                    title: '',
                    issued_by: '',
                    year: ''
                }
            ],
            ...data
        };
        const response = await this.save(userId, resumeId, selectedTemplate, emptyData);
        return response
    }

    static async uploadResume(file: File, userId: string) {
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

            const resumeId = self.crypto.randomUUID();
            const saveResume = await ResumeService.save(userId, resumeId, 'modern', data.data);
            return saveResume
        } catch (error) {
            throw error
        }
    }

}

export function getJobDescription(url: string) {
    if (!url) {
        return {
            status: 404,
            message: "No url provided"
        }
    }
    try {
        console.log(url)



    } catch (error) {
        return {
            status: 400,
            message: JSON.stringify(error)
        }
    }

}

const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker source for pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
                            .map((item) => {
                                if ('str' in item) {
                                    return item.str;
                                }
                                return '';
                            })
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