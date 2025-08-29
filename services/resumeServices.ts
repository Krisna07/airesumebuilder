import { ResumeData } from "@/types/types";

export class ResumeService {
    static async save(userId: string, resumeId: string, template: string, resumeData: ResumeData) {
        try {
            const saveResumeToDb = await fetch('/api/resume', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...resumeData,
                    id: resumeId,
                    userId: userId,
                    template: template
                })
            }).then((res) => res.json())
            if (saveResumeToDb.status !== 200) {
                return {
                    status: saveResumeToDb.status,
                    error: saveResumeToDb.error || 'Failed to save resume',
                };
            }
            return {
                status: 200,
                data: saveResumeToDb.data
            }
        } catch (error) {
            return {
                status: 500,
                error: (error instanceof Error ? error.message : 'Unknown error'),
            };
        }
    }

    static async getSingle(resumeId: string) {
        try {
            const response = await fetch(`/api/resume?id=${resumeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.json())
            console.log(response)
            if (response.status !== 200) {
                return {
                    status: response.status,
                    error: response.error || 'Failed to fetch resume',
                };
            }
            return {
                status: 200,
                data: response.data
            }
        } catch (err) {
            return {
                status: 404,
                error: JSON.stringify(err),
            }
        }
    }

    static async getAll(userId: string | null) {
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
        const result = await this.save(userId, resumeId, selectedTemplate, emptyData);
        return {
            ...result,
        };
    }

}

// export function getResumeData(resumeId: string) {
//     // Only access localStorage in the browser
//     if (typeof window !== 'undefined' && resumeId) {
//         const availableResume = localStorage.getItem('resumeData');
//         if (availableResume) {
//             try {
//                 const parsed = JSON.parse(availableResume);
//                 return {
//                     profile: parsed.profile || '',
//                     skills: parsed.skills || [],
//                     experience: parsed.experience || [],
//                     education: parsed.education || [],
//                     certificates: parsed.certificates || []
//                 };
//             } catch {
//                 // Invalid JSON, fall through to default
//             }
//         }
//     }
//     return {

//         profile: {
//             fullname: '',
//             email: '',
//             phone: '',
//             location: '',
//             links: [{ type: '', url: '' }],
//             summary: ''
//         },
//         skills: [],
//         experience: [],
//         education: [],
//         certificates: []
//     };
// }

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

// export async function createResume(userId: string) {
//     const response = await ResumeStorage.create(userId);
//     console.log(response)
//     if (response.error) {
//         console.log(response.error);
//         return
//     }
//     if (response.status !== 200) {
//         console.log(response.message);
//         return
//     }

//     window.location.href = `/builder/${response.data.id}`;
//     return {
//         response
//     }

// }

// export async function getResume(resumeId: string) {
//     try {
//         const resume = await fetch(`/api/resume?id=${resumeId}`, {
//             method: 'GET',
//             headers: { 'Content-Type': 'application/json' },
//         }).then(res => res.json())
//         return {
//             status: 200,
//             data: resume.data
//         }
//     } catch (err) {
//         return {
//             status: 404,
//             error: err,
//             message: 'resume not found'
//         }
//     }
// }

// export async function getAllResumes(userId: string) {
//     try {
//         const resumes = await fetch(`/api/resume/all?userId=${userId}`, {
//             method: 'GET',
//             headers: { 'Content-Type': 'application/json' },
//         }).then(res => res.json())
//         return {
//             status: 200,
//             data: resumes.data
//         }
//     } catch (err) {
//         return {
//             status: 500,
//             error: (err instanceof Error ? err.message : 'Unknown error'),
//             Message: 'Failed to fetch resumes'
//         }
//     }
// }