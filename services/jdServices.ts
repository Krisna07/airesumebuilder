import { JobDescription, JobDetailsWithAnalysis } from "@/types/types";
import { v4 as uuidv4 } from 'uuid';


export class JobDescriptionService {
    static async save(resumeId: string, userId: string, jobDetails: JobDescription) {
        try {
            console.log('Saving job description:', jobDetails);
            const response = await fetch('/api/resume/description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    company: jobDetails.company,
                    title: jobDetails.title,
                    location: jobDetails.location,
                    domain: jobDetails.domain,
                    url: jobDetails.url || '',
                    description: jobDetails.description
                })
            });
            return response;
        } catch (error) {
            throw error
        }
    }

    static async saveLocal(resumeId: string, jobDetails: JobDescription) {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                throw new Error('localStorage is not available');
            }

            const key = `localJobDescriptions_${resumeId}`;
            const id = uuidv4();
            const item = {
                id,
                resumeId,
                company: jobDetails.company,
                title: jobDetails.title,
                location: jobDetails.location,
                domain: jobDetails.domain,
                url: jobDetails.url || '',
                description: jobDetails.description
            };

            // read existing array safely
            const raw = localStorage.getItem(key);
            let list: (JobDescription & { id: string })[] = [];
            if (raw && raw !== 'undefined') {
                try {
                    list = JSON.parse(raw) as typeof list;
                    list = list.filter((jd) => jd && jd.url !== jobDetails.url); // remove any existing with same url
                    if (!Array.isArray(list)) list = [];
                } catch {
                    // corrupted value -> reset to empty
                    list = [];
                }
            }

            // append and save
            list.push(item);
            localStorage.setItem(key, JSON.stringify(list));
            return item;
        } catch (error) {
            throw error;
        }
    }

    static getLocal(resumeId: string) {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                throw new Error('localStorage is not available');
            }
            const key = `localJobDescriptions_${resumeId}`;
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'undefined') return [];
            try {
                const list = JSON.parse(raw) as (JobDescription & { id: string })[];
                return Array.isArray(list) ? list : [];
            } catch {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }

    static async removeLocal(resumeId: string, id: string) {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                throw new Error('localStorage is not available');
            }
            const key = `localJobDescriptions_${resumeId}`;
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'undefined') return false;
            try {
                const list = JSON.parse(raw) as (JobDescription & { id: string })[];
                if (!Array.isArray(list)) return false;
                const newList = list.filter(x => x.id !== id);
                localStorage.setItem(key, JSON.stringify(newList));
                return true;
            } catch {
                return false;
            }
        } catch (error) {
            throw error;
        }
    }

    static async remove(userId: string, jobDescriptionId: string) {
        try {
            const response = await fetch(`/api/resume/description?userId=${userId}&jobDescriptionId=${jobDescriptionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })
            if (!response.ok) {
                throw new Error('Failed to delete job description');
            }
            return response;
        } catch (error) {
            throw error
        }
    }

    static async removeAnalysisReport(analysisId: string, resumeId: string) {
        try {
            const response = await fetch(`/api/ai/analyze?analysisId=${analysisId}&resumeId=${resumeId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error('Failed to delete analysis report');
            }
            return response;
        } catch (error) {
            throw error
        }
    }

    static async getAll(userId: string, resumeId?: string) {
        try {
            const response = await fetch(`/api/resume/description?userId=${userId}&resumeId=${resumeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch job descriptions');
            }
            const data = await response.json();
            const responseData: JobDetailsWithAnalysis[] = data.data

            return {
                status: response.status || 200,
                data: responseData
            }

        } catch (error) {
            throw error
        }
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