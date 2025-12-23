/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { AnalysisResult, JobDescription as JobDetailsType } from '@/types/types';
import Input from '../Input';
import Button from '../UI/Button';
import { analyzeResume } from '@/services/resumeServices';
import Link from 'next/link';
import { getJobDescription, JobDescriptionService } from '@/services/jdServices';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';


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
  const [jobDetails, setJobDetails] = useState<JobDetailsType[]>()
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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

  const startAnalysis = useCallback(async (jobDetails: JobDetailsType) => {
    if (!resumeId) {
      setError('Missing resume id');
      return;
    }

    if (!jobDetails.description) {
      setError('No job description');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeResume(resumeId, jobDetails, true);
      if (result.status !== 200) {
        setError(result.error || 'Failed to analyze');
        return;
      }
      console.log(JSON.parse(result.data.result))
      setAnalysis(JSON.parse(result.data.result));
    } catch (err: any) {
      setError(err?.message || 'Analyze failed');
    } finally {
      setAnalyzing(false);
    }
  }, [jobDescription, resumeId]);

  return (
    <div className="w-full relative">
      {analysis && (
        <div className="mb-4 rounded border border-sky-200 bg-sky-50 p-3 text-xs space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sky-800">
              Match: {Math.round(analysis.matchingPercentage)}%
            </span>
            {analysis.role && (
              <span className="rounded bg-white px-2 py-0.5 border text-[10px] font-medium text-sky-700">
                {analysis.role}
              </span>
            )}
          </div>
          {analysis.description && (
            <p className="text-sky-900 leading-snug">{analysis.description}</p>
          )}
          {analysis.suggestions?.length > 0 && (
            <div>
              <p className="font-medium text-sky-800 mb-1">Suggestions</p>
              <ul className="list-disc ml-5 space-y-0.5 marker:text-sky-500">
                {analysis.suggestions.slice(0, 6).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.strengths?.length ? (
              <div>
                <p className="font-medium text-green-700 mb-1">Strengths</p>
                <ul className="list-disc ml-5 space-y-0.5 marker:text-green-500">
                  {analysis.strengths.slice(0, 5).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {analysis.missingKeywords?.length ? (
              <div>
                <p className="font-medium text-amber-700 mb-1">Missing Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.missingKeywords.slice(0, 12).map((k, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

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
      {
        textField ?
          <textarea
        onChange={updateJobDescription}
        value={jobDescription}
        placeholder="Paste or extract a job description..."
        className="w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y"
      />


          : jobDetails && (
            <div className=" mt-2 p-2 bg-white border-gray-500 border-[1px] rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">Available Desriptions</h3>
              {jobDetails.map((job: any, count: number) =>
                <div key={count} className='grid gap-2 mt-4'>
                  <div className='flex items-center justify-between'>
                    <Link className=' font-seminbold underline cursor-pointer' href={job.url}>{job.title}</Link>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => startAnalysis(job)}
                        disabled={analyzing}
                        className={analyzing ? 'animate-pulse' : ''}
                      >
                        {analyzing ? 'Analyzing…' : 'Analyse'}
                      </Button>
                    </div>
                  </div>
                  <div className="grid text-xs grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Company</p>
                      <p className=" text-slate-700">
                        {job.company ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className=" text-slate-700">
                        {job.location ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <div className="text-xs text-slate-700 leading-relaxed max-h-36 overflow-auto p-2 bg-slate-50 border rounded">
                      {job.description ?? '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
      }
    </div>
  );
};

export default JobDescription;
