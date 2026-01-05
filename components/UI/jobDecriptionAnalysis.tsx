import React, { useState } from 'react';
import Button from './Button';
import { AnalysisResult, JobDescription, JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import { analyzeResume } from '@/services/resumeServices';
import { BotIcon, ChevronDown } from 'lucide-react';
import JobAnalysisReport from './JobAnalysisReport';
import { useToast } from '@/context/PopupContext';

type Props = {
    job: JobDetailsWithAnalysis;
    resumeId?: string;
    itemKey?: number | string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleRegenerate?: (resumeData: ResumeData, analysis?: any, jobDescription?: any) => Promise<void>;
    resumeData?: ResumeData
};

const JobDecriptionAnalysis: React.FC<Props> = ({ job, resumeId, itemKey, handleRegenerate, resumeData }) => {
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [analysis, setAnalysis] = useState<AnalysisResult>(job.hasAnalysed && JSON.parse(job.analysis?.result as string));
    const { showToast } = useToast()
    // console.log(job)
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
                showToast('Error analysing resume', 'warning', 3000)
                throw new Error(result.error || `Analysis failed with status ${result.status}`);

            }
            const parsed = result.data?.result ? JSON.parse(result.data.result) : null;
            setAnalysis(parsed)
            showToast('Resume has been analysed, successfully', 'success', 3000)

        } catch (err) {
            showToast('Error analysing resume', 'warning', 3000)
            throw err;
        } finally {
            setAnalyzing(false);
        }
    };


    return (
        <div key={itemKey} className='grid gap-2 mt-4 border-gray-500 rounded-md shadow-sm p-4 '>
            {!analysis &&
                <div className='grid text-xs grid-cols-1 md:grid-cols-3 gap-4'>
                    <div >
                        <p className='text-xs text-slate-500'>Position</p>
                        <p className=' text-slate-700'>{job?.title ?? '—'}</p>
                    </div>
                    <div>
                        <p className='text-xs text-slate-500'>Location</p>
                        <p className=' text-slate-700'>{job?.location ?? '—'}</p>
                    </div>
                </div>}
            {job.hasAnalysed && analysis && (
                <JobAnalysisReport {...analysis} />
            )}
            {showDetails.jobDescriptionVisibility &&
                <div className=''>
                    <p className='text-xs text-slate-500 mb-2'>Description</p>
                    <div className='w-full max-h-[220px]  overflow-y-scroll border shadow-md text-xs text-slate-600 rounded-md p-2 outline-green-300 active:border-green-300 resize-y'>{job.description ?? '—'}</div>
                </div>
            }

            <div className='flex max-[650px]:flex-col gap-2 items-center justify-between'>
                <Button size='small' variant='secondary' className='text-[10px] text-slate-500 w-fit max-[650px]:w-full  shadow px-2 py-1 rounded flex items-center' onClick={() => updateShowDetails('jobDescriptionVisibility')}>
                    <ChevronDown size={12} className={`transition-transform ${showDetails.jobDescriptionVisibility ? 'rotate-180' : 'rotate-0'}`} />
                    {showDetails.jobDescriptionVisibility ? 'Hide description' : 'View description'}
                </Button >
                {
                    resumeData && handleRegenerate &&
                    <Button variant='primary' className={`md:w-fit w-full`} size='small' onClick={() => handleRegenerate(resumeData, analysis || job.description)} ><BotIcon size={14} /> Optimise Resume</Button>

                }
                <Button variant='secondary' size='small' onClick={() => startAnalysis(job)} disabled={analyzing} className={`${analyzing ? 'animate-pulse' : ''} max-[650px]:w-full`}>
                    {analyzing ? 'Analyzing…' : job?.hasAnalysed ? 'Re-analyse' : 'Analyse'}
                </Button>
            </div>
        </div>
    );
};

export default JobDecriptionAnalysis;
