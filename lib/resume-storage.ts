import { ResumeData, UserResume } from '@/types/types';

export interface StoredResume {
    resumeId: string;
    template: UserResume['template'];
    resumeData: ResumeData;
    createdOn: string;
}

export class ResumeStorage {
    private static storageKey = 'resumeData';

    static save(resumeId: string, template: UserResume['template'], resumeData: ResumeData): void {
        const all = this.loadAll();
        const now = new Date().toISOString();
        const idx = all.findIndex(r => r.resumeId === resumeId);
        const newResume: StoredResume = {
            resumeId,
            template,
            resumeData,
            createdOn: idx === -1 ? now : all[idx].createdOn
        };
        if (idx === -1) {
            all.push(newResume);
        } else {
            all[idx] = newResume;
        }
        localStorage.setItem(this.storageKey, JSON.stringify(all));
    }

    static load(resumeId: string): StoredResume | undefined {
        return this.loadAll().find(r => r.resumeId === resumeId);
    }

    static loadAll(): StoredResume[] {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as StoredResume[];
        } catch {
            return [];
        }
    }

    static delete(resumeId: string): void {
        const all = this.loadAll().filter(r => r.resumeId !== resumeId);
        localStorage.setItem(this.storageKey, JSON.stringify(all));
    }

    static exists(resumeId: string): boolean {
        return this.loadAll().some(r => r.resumeId === resumeId);
    }

    static listAll(): StoredResume[] {
        return this.loadAll().sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    }

    static create(template: UserResume['template'] = 'classic', data?: Partial<ResumeData>): string {
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
        this.save(resumeId, template, emptyData);
        return resumeId;
    }
}