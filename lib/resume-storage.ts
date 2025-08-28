import { getResume } from '@/services/resumeServices';
import { ResumeData, UserResume } from '@/types/types';
export interface StoredResume {
    resumeId: string;
    template: UserResume['template'];
    resumeData: ResumeData;
    createdOn: string;
}

export class ResumeStorage {
    private static storageKey = 'resumeData';

    static async save(resumeId: string, userId: string, template: UserResume['template'], resumeData: ResumeData) {

        const saveResumeToDb = await fetch('/api/resume', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: resumeId,
                userId: userId,
                template: template,
                ...resumeData
            })
        }).then((res) => res.json())
        if (saveResumeToDb.status !== 200) {
            return {
                status: saveResumeToDb.status,
                error: saveResumeToDb.error || 'Failed to save resume',
                message: saveResumeToDb.message || 'Failed to save resume'
            };
        }
        return saveResumeToDb
    }

    static async load(resumeId: string) {
        const resumeData = await getResume(resumeId)
        if (resumeData.status !== 200) {
            throw new Error(resumeData.message || 'Failed to load resume');
        }
        return resumeData;
    }

    static async loadAll(userId: string | null) {
        if (!userId) return [];
        try {
            const response = await fetch(`/api/resume/all?id=${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.json())
            if (response.status === 200) {
                return response.data

            } else {
                return response
            }
        } catch (err) {
            return {
                status: 500,
                error: (err instanceof Error ? err.message : 'Unknown error'),
                Message: 'Failed to fetch resumes'
            }
        }
    }

    // static delete(resumeId: string): void {
    //     const all = this.loadAll().filter(r => r.resumeId !== resumeId);
    //     localStorage.setItem(this.storageKey, JSON.stringify(all));
    // }

    // static exists(resumeId: string): boolean {
    //     return this.loadAll().some(r => r.resumeId === resumeId);
    // }

    // static listAll(): StoredResume[] {
    //     return this.loadAll().sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    // }

    static async create(userId: string, template: UserResume['template'] = 'classic', data?: Partial<ResumeData>) {
        const resumeId = crypto.randomUUID();
        const emptyData: ResumeData = {
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
                    skills: ['']
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
                    responsibilities: ['']
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
        const result = await this.save(resumeId, userId, template, emptyData);
        return result;
    }
}