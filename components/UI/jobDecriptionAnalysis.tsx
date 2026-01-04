import React, { useState } from 'react';
import Button from './Button';
import { AnalysisResult, JobDescription, JobDetailsWithAnalysis } from '@/types/types';
import { analyzeResume } from '@/services/resumeServices';
import { ChevronDown } from 'lucide-react';
import JobAnalysisReport from './JobAnalysisReport';

type Props = {
    job: JobDetailsWithAnalysis;
    resumeId?: string;
    itemKey?: number | string;
};

const JobDecriptionAnalysis: React.FC<Props> = ({ job, resumeId, itemKey }) => {
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    // job.analysis may be an array (latest analysis at index 0). Safely parse.
    const initialAnalysis = (() => {
        try {
            if (!job?.hasAnalysed) return null;
            const raw = Array.isArray(job.analysis) ? job.analysis[0] : job.analysis;
            if (!raw) return null;
            return typeof raw === 'string' ? JSON.parse(raw) as AnalysisResult : (raw as AnalysisResult);
        } catch (e) {
            console.warn('Failed to parse initial analysis:', e);
            return null;
        }
    })();

    const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis);
    type ShowDetailsState = {
        jobDescriptionVisibility: boolean;
        analysisDetails: boolean;
    };

    const [showDetails, setShowDetails] = useState<ShowDetailsState>({
        jobDescriptionVisibility: false,
        analysisDetails: false
    });

    const updateShowDetails = (key: keyof ShowDetailsState) => {
        setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const startAnalysis = async (jobDetails: JobDescription) => {
        if (!resumeId) return;
        if (!jobDetails.description) return;
        setAnalyzing(true);
        try {
            const result = await analyzeResume({
                resumeId,
                jobDetails
            });
            if (result.status !== 200) {
                throw new Error(result.error || `Analysis failed with status ${result.status}`);
            }
            const parsed = result.data?.result ? JSON.parse(result.data.result) : null;
            setAnalysis(parsed);
        } catch (err) {
            throw err;
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div key={itemKey} className='grid gap-2 mt-4 border-gray-500 rounded-md shadow-sm p-4'>
            <div className='grid text-xs grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                    <p className='text-xs text-slate-500'>Position</p>
                    <p className=' text-slate-700'>{job?.title ?? '—'}</p>
                </div>
                <div>
                    <p className='text-xs text-slate-500'>Location</p>
                    <p className=' text-slate-700'>{job?.location ?? '—'}</p>
                </div>
                <Button size='small' variant='secondary' className='text-[10px] text-slate-500 w-fit shadow px-2 py-1 rounded flex items-center' onClick={() => updateShowDetails('jobDescriptionVisibility')}>
                    <ChevronDown size={12} className={`transition-transform ${showDetails.jobDescriptionVisibility ? 'rotate-180' : 'rotate-0'}`} />
                    {showDetails.jobDescriptionVisibility ? 'Hide description' : 'View description'}
                </Button >
            </div>
            {showDetails.jobDescriptionVisibility && <div className='w-full min-h-[220px] border shadow-md text-xs text-slate-600 rounded-md p-2 outline-green-300 active:border-green-300 resize-y'>{job.description ?? '—'}</div>}

            {analysis && (
                <JobAnalysisReport {...analysis} />
            )}

            <div className='flex items-center justify-between'>
                <div className='flex gap-2'>
                    <Button variant='secondary' size='small' onClick={() => startAnalysis(job)} disabled={analyzing} className={analyzing ? 'animate-pulse' : ''}>
                        {analyzing ? 'Analyzing…' : job.hasAnalysed ? 'Re-analyse' : 'Analyse'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default JobDecriptionAnalysis;
