/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import Input from '../Input';
import Button from '../UI/Button';
import { getJobDescription, JobDescriptionService } from '@/services/jdServices';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import JobDecriptionAnalysis from '../UI/jobDecriptionAnalysis';
import { FaSpinner } from 'react-icons/fa6';
import { BugIcon } from 'lucide-react';
import { useJobDescriptions } from '@/hooks/useJobDescriptions';


interface JDProps {
  resumeId?: string;
  disabled?: boolean;
  hideAnalysis?: boolean;
  hideInput?: boolean;
  hideTitle?: boolean;
  handleRegenerate?: (resumeData: ResumeData, analysis?: any, jobDescription?: any) => Promise<void>;
  resumeData?: ResumeData;
}

export type ScrapeResult = {
  url: string;
  success: boolean;
  description?: string;
  title?: string;
  company?: string;
  location?: string;
  error?: string;
  domain?: string;
};

const JobDescription: React.FC<JDProps> = ({ resumeId, disabled, hideAnalysis, hideInput, hideTitle, handleRegenerate, resumeData }) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobDetails, setJobDetails] = useState<JobDetailsWithAnalysis[]>()
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false)
  const [textField, setTextField] = useState<boolean>(false)
  const { user } = useAuth()

  const { showToast } = useToast()
  const userId: string = user?.id ?? ''
  useEffect(() => {
    if (error) {
      showToast(error, 'error', 3000)
      setLoading(false)
      setExtracting(false)
    }
  }, [error, showToast])


  const triggerTextField = () => {
    setTextField(!textField)
  }

  const response = useJobDescriptions(userId, resumeId);

  useEffect(() => {
    if ((disabled || !userId) && resumeId) {
      const localDescriptions = JobDescriptionService.getLocal(resumeId)
      if (localDescriptions.length) {
        setJobDetails(localDescriptions)
      }
      return;
    }

    setLoading(response.isLoading)
    if (response.data?.status === 202) {
      setTextField(true)
      return
    }
    if (response.isSuccess) {
      setJobDetails(response.data.data)
      setLoading(false)
    }
  }, [disabled, response, resumeId, userId]);

  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setJobDescription(e.target.value);
  };



  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const extractDescriptions = async () => {
    setError(null);
    const userId = user?.id;
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter at least one URL');
      setExtracting(false)
      return;
    }
    const candidates = trimmed.split(/[,\s]+/).filter(Boolean);
    const valid = candidates.filter(u => /^https?:\/\//i.test(u));
    if (!valid.length) {
      setError('No valid URL detected');
      return;
    }

    try {
      const result = await getJobDescription(valid);
      if ((disabled || !userId) && resumeId) {
        setError(result.message || 'Failed to fetch description');
        return;
      }
      if (result.blocked) {
        setError(result.message || 'Site blocked automated scraping. Please paste manually.');
      }

      const raw = result.raw || [];
      // save first result immediately (use 'raw' from response to avoid stale state)
      if (resumeId && raw.length) {
        if (disabled) {
          await JobDescriptionService.saveLocal(resumeId, raw[0])
          const allJds = JobDescriptionService.getLocal(resumeId)
          setJobDetails(allJds)
          setExtracting(false)
        }
        const userId = user?.id
        if (!userId) {
          return
        }

        const response = await JobDescriptionService.save(resumeId, userId, raw[0])


        if (!response.ok) {
          setError('Uh oh! there is some error saving data')
          console.log(response)
          return
        }
        const data = await response.json()
        // merge new job description and remove duplicates by id
        setJobDetails(prev => {
          const merged = [...(prev || []), data.data];
          const map = new Map<string, any>(
            merged.map((j: any) => [j && j.id ? String(j.id) : JSON.stringify(j), j])
          );
          return Array.from(map.values());
        })
      }
      response.refetch()
    } catch (err: any) {
      console.error('extractDescriptions error', err);
      setError(err?.message || 'Failed to extract descriptions');
    } finally {
      setExtracting(false);
    }
  }
  return (
    <div className="w-full relative">
      {!hideInput && <div className="py-4 grid gap-2 px-2">
        <Input
          type="text"
          name="url"
          value={url}
          onChange={updateUrl}
          placeholder="Enter Job Url"
        />
        <div className='flex gap-4 items-center'> <Button
          variant="primary"
          size="small"
          onClick={extractDescriptions}
          disabled={extracting || loading}
          className={extracting ? 'animate-pulse' : ''}
        >
          {extracting ? 'Extracting…' : 'Extract'}
        </Button>
          {!hideAnalysis && <Button
            variant="secondary"
            size="small"
            onClick={() => triggerTextField()}
            disabled={extracting || loading}
            className={extracting ? 'animate-pulse' : ''}
          >
            {textField ? 'Hide' : 'Paste Description'}
          </Button>}

        </div>
      </div>}
      {loading && <div className='flex items-center gap-2 animate-pulse'>Loading available job details  <div className='animate-bounce'><FaSpinner className='text-4xl animate-spin ' /></div></div>}

      <div className='relative'>
        {
          textField &&
          <textarea
            onChange={updateJobDescription}
            value={jobDescription}
            placeholder="Paste or extract a job description..."
            className="w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y"
          />
        }

        {jobDetails?.length && (
          <div className="w-full mt-2 grid gap-4 bg-white ">
            {!hideAnalysis && <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 flex items-center gap-2"><BugIcon size={16} /> Reports </h3>
              {jobDetails && jobDetails.filter((jd) => jd.hasAnalysed).map((job: JobDetailsWithAnalysis, count: number) =>
                <JobDecriptionAnalysis key={count} job={job} resumeId={resumeId} />
              )}
            </div>}

            <div>
              {!hideTitle && <h3 className="text-lg font-semibold mb-3 text-slate-800">Available Job Description</h3>}
              {jobDetails && jobDetails.filter((jd) => !jd.hasAnalysed).map((job: JobDetailsWithAnalysis, count: number) =>
                <JobDecriptionAnalysis key={count} job={job} resumeId={resumeId} handleRegenerate={handleRegenerate} resumeData={resumeData} />
              )}
            </div>
          </div>
        )
        }
      </div>
    </div>
  );
};

export default JobDescription;
