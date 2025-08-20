'use client '


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
