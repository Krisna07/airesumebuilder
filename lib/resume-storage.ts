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
        console.log({
            resumeId: resumeId,
            resumeData: resumeData,
            template: template
        })

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
        return saveResumeToDb

        // const all = this.loadAll();
        // const now = new Date().toISOString();
        // const idx = all.findIndex(r => r.resumeId === resumeId);
        // const newResume: StoredResume = {
        //     resumeId,
        //     template,
        //     resumeData,
        //     createdOn: idx === -1 ? now : all[idx].createdOn
        // };
        // if (idx === -1) {
        //     all.push(newResume);
        // } else {
        //     all[idx] = newResume;
        // }
        // localStorage.setItem(userId, JSON.stringify(all));
    }

    static async load(resumeId: string) {
        const resumeData = await getResume(resumeId)
        if (resumeData.status !== 200) {
            throw new Error(resumeData.message || 'Failed to load resume');
        }
        return resumeData.data;
    }

    // static loadAll(): StoredResume[] {
    //     const raw = localStorage.getItem(this.storageKey);
    //     if (!raw) return [];
    //     try {
    //         return JSON.parse(raw) as StoredResume[];
    //     } catch {
    //         return [];
    //     }
    // }

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
            skills: [],
            experience: [],
            education: [],
            certificates: [],
            ...data
        };
        const result = await this.save(resumeId, userId, template, emptyData);
        return result;
    }
}