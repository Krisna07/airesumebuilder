'use client '

import { ResumeStorage } from "@/lib/resume-storage";


export function getResumeData(resumeId: string) {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined' && resumeId) {
        const availableResume = localStorage.getItem('resumeData');
        if (availableResume) {
            try {
                const parsed = JSON.parse(availableResume);
                return {
                    profile: parsed.profile || '',
                    skills: parsed.skills || [],
                    experience: parsed.experience || [],
                    education: parsed.education || [],
                    certificates: parsed.certificates || []
                };
            } catch {
                // Invalid JSON, fall through to default
            }
        }
    }
    return {

        profile: {
            fullname: '',
            email: '',
            phone: '',
            location: '',
            links: [{ type: '', url: '' }],
            summary: ''
        },
        skills: [],
        experience: [],
        education: [],
        certificates: []
    };
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

export async function createResume(userId: string) {
    const uuid = await ResumeStorage.create(userId);
    // console.log(uuid)
    window.location.href = `/builder/${uuid}`;
    return {
        uuid
    }

}

export async function getResume(resumeId: string) {
    try {
        const resume = await fetch(`/api/resume?id=${resumeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json())
        return {
            status: 200,
            data: resume.data
        }
    } catch (err) {
        return {
            status: 404,
            error: err,
            message: 'resume not found'
        }
    }
}