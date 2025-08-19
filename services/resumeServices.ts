'use client '


export function getResumeData(resumeId: string) {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined' && resumeId) {
        const availableResume = localStorage.getItem(resumeId);
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
