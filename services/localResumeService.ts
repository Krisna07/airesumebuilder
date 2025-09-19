import { ResumeData } from "@/types/types";


export class LocalResumeService {
    static async save(userId: string, resumeId: string, emptyData: ResumeData) {
        console.log('saving local resume', emptyData);
        try {
           await localStorage.setItem(`${resumeId}`, JSON.stringify({
                ...emptyData
            } ))
        } catch (error) {
            throw error
        }
    }

    static async update(resumeId: string, data: ResumeData) {
        console.log('updating local resume', data);
        try {
            const updateResume = localStorage.setItem(`${resumeId}`, JSON.stringify({
                ...data
            }))
            return updateResume
        } catch (error) {
            throw error
        }
    }

    static async create(data?: Partial<ResumeData>, userId?: string, template?: string) {
        console.log('creating local resume');
        // const prevResume = await localStorage.getItem('guest-resume');
        // if (prevResume) {
        //     return 'guest-resume'
        // }
        const resumeId = 'guest-resume';
        const selectedTemplate = template || 'Classic';
        const emptyData: ResumeData = {
            id: resumeId,
            userId: userId || 'guest',
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
            certificates: [],
            ...data
        };
        await this.save(emptyData.userId, resumeId, emptyData);
        return emptyData
    }
}