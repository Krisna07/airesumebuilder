/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { JobDetailsWithAnalysis } from '@/types/types';
import Input from '../Input';
import Button from '../UI/Button';

import { getJobDescription, JobDescriptionService } from '@/services/jdServices';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import JobDecriptionAnalysis from '../UI/jobDecriptionAnalysis';


interface JDProps {
  resumeId?: string;
  disabled?: boolean;

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

const JobDescription: React.FC<JDProps> = ({ resumeId, disabled }) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobDetails, setJobDetails] = useState<JobDetailsWithAnalysis[]>()
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [textField, setTextField] = useState<boolean>(false)
  const { user } = useAuth()

  const toast = useToast()

  useEffect(() => {
    if (error) {
      toast.showToast(error, 'error', 3000)
    }

  }, [error])

  const fetchDescription = async () => {
    if (user) {
      const response = await JobDescriptionService.getAll(user.id, resumeId)
      if (response.status !== 200) {
        setError('Unable to fetch all previous Job desctiptions')
      }
      if (response.status === 202) {
        setTextField(true)
        return
      }
      // const data = await response.json()
      console.log(response.data)
      setJobDetails(response.data)
    }
  };

  const triggerTextField = () => {
    setTextField(!textField)
  }

  useEffect(() => {
    if ((disabled || !user?.id) && resumeId) {
      const localDescriptions = JobDescriptionService.getLocal(resumeId)
      if (localDescriptions.length) {
        setJobDetails(localDescriptions)
      }
      return;
    }
    try {
      fetchDescription();

    } catch (err) {
      throw err;
    }
  }, [disabled, resumeId]);

  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setJobDescription(e.target.value);
  };



  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };


  const extractDescriptions = async () => {
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter at least one URL');
      return;
    }
    const candidates = trimmed.split(/[,\s]+/).filter(Boolean);
    const valid = candidates.filter(u => /^https?:\/\//i.test(u));
    if (!valid.length) {
      setError('No valid URL detected');
      return;
    }

    setLoading(true);
    try {
      const result = await getJobDescription(valid);
      if (result.status !== 200) {
        setError(result.message || 'Failed to fetch description');
        return;
      }
      if (result.blocked) {
        setError(result.message || 'Site blocked automated scraping. Please paste manually.');
      }

      const raw = result.raw || [];
      console.log(raw)
      // save first result immediately (use 'raw' from response to avoid stale state)
      if (resumeId && raw.length) {
        if (disabled) {
          await JobDescriptionService.saveLocal(resumeId, raw[0])
          const allJds = JobDescriptionService.getLocal(resumeId)
          setJobDetails(allJds)
        }

        const response = await JobDescriptionService.save(resumeId, raw[0])
        if (!response.ok) {
          setError('Uh oh! there is some error saving data')
          await JobDescriptionService.saveLocal(resumeId, raw[0])
          const allJds = JobDescriptionService.getLocal(resumeId)
          setJobDetails(allJds)
        }
        const data = await response.json()
        console.log(data)
        // merge new job description and remove duplicates by id
        setJobDetails(prev => {
          const merged = [...(prev || []), data.data];
          const map = new Map<string, any>(
            merged.map((j: any) => [j && j.id ? String(j.id) : JSON.stringify(j), j])
          );
          return Array.from(map.values());
        })
      }
    } catch (err: any) {
      console.error('extractDescriptions error', err);
      setError(err?.message || 'Failed to extract descriptions');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="w-full relative">
      <div className="py-4 grid gap-2">
        <Input
          type="text"
          name="url"
          value={url}
          onChange={updateUrl}
          placeholder="Enter one or more URLs (comma, space or newline separated)"
        />
        <div className='flex gap-4 items-center'> <Button
          variant="primary"
          size="small"
          onClick={extractDescriptions}
          disabled={loading}
          className={loading ? 'animate-pulse' : ''}
        >
          {loading ? 'Extracting…' : 'Extract'}
        </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => triggerTextField()}
            disabled={loading}
            className={loading ? 'animate-pulse' : ''}
          >
            {textField ? 'Hide' : 'Paste Description'}
          </Button>

        </div>
      </div>
      {textField ?
        <textarea
          onChange={updateJobDescription}
          value={jobDescription}
          placeholder="Paste or extract a job description..."
          className="w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y"
        />
        : jobDetails && (
          <div className="w-full mt-2  bg-white ">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Available Desriptions</h3>
            {jobDetails.map((job: any, count: number) =>
              <JobDecriptionAnalysis key={count} job={job} resumeId={resumeId} />
            )}
          </div>
        )
      }
    </div>
  );
};

export default JobDescription;
