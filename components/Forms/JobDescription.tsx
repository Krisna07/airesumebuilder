/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { AnalysisResult } from '@/types/types';
import Input from '../Input';
import Button from '../UI/Button';
import { getJobDescription, analyzeResume } from '@/services/resumeServices';

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

type JDMeta = { count: number; succeeded: number; failed: number };
type JDResult = {
  status: number;
  description?: string;
  raw?: ScrapeResult[];
  blocked?: boolean;
  message?: string;
  meta?: JDMeta;
};

const JobDescription: React.FC<JDProps> = ({ resumeId, disabled }) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  // const [rawResults, setRawResults] = useState<ScrapeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (disabled) {
      return;
    }
    const fetchDescription = async () => {
      const descriptionResp = await fetch(`/api/resume/description?slug=${resumeId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (descriptionResp.ok) {
        try {
          const descriptionData = await descriptionResp.json();
          if (descriptionResp.status === 202) {
            return
          }
          // Expecting either { data: ScrapeResult } or the ScrapeResult directly
          setJobDescription(descriptionData?.data?.description);
          // setUrl(descriptionData?.data?.url);
        } catch (e) {
          console.warn('Failed to parse description response', e);
        }
      } else {
        setJobDescription(`No job description added yet`)
        console.warn('Description fetch failed', descriptionResp.status);
      }
    };

    try {

      fetchDescription();

    } catch (err) {
      throw err;
    }
  }, []);

  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setJobDescription(e.target.value);
  };

  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const saveDescription = useCallback(async (resumeIdValue: string, source?: ScrapeResult) => {
    if (!resumeIdValue || !source || disabled) return;
    try {
      const resp = await fetch('/api/resume/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeIdValue,
          url: source.url,
          description: source.description,
          title: source.title,
          company: source.company,
          location: source.location,
          domain: source.domain,
        }),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(json?.error || resp.statusText || 'Failed to save description');
      }
    } catch (err: any) {
      console.error('saveDescription error', err);
      setError(err.message || 'Failed to save description');
    }
  }, []);

  const extractDescriptions = useCallback(async () => {
    if (disabled) {
      return;
    }
    setError(null);
    // setRawResults([]);
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
      const result = (await getJobDescription(valid)) as JDResult;
      if (result.status !== 200) {
        setError(result.message || 'Failed to fetch description');
        return;
      }
      if (result.blocked) {
        setError(result.message || 'Site blocked automated scraping. Please paste manually.');
      }

      const raw = result.raw || [];
      // setRawResults(raw);
      setJobDescription(result.description || '');

      // save first result immediately (use 'raw' from response to avoid stale state)
      if (resumeId && raw.length) {
        await saveDescription(resumeId, raw[0]);
      }
    } catch (err: any) {
      console.error('extractDescriptions error', err);
      setError(err?.message || 'Failed to extract descriptions');
    } finally {
      setLoading(false);
    }
  }, [url, resumeId, saveDescription]);

  const startAnalysis = useCallback(async () => {
    if (!jobDescription) {
      setError('No job description');
      return;
    }
    if (!resumeId) {
      setError('Missing resume id');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeResume(resumeId, jobDescription, true);
      if (result.status !== 200) {
        setError(result.error || 'Failed to analyze');
        return;
      }
      setAnalysis(result.analysis);
    } catch (err: any) {
      setError(err?.message || 'Analyze failed');
    } finally {
      setAnalyzing(false);
    }
  }, [jobDescription, resumeId]);

  return (
    <div className="w-full relative">
      {disabled && (
        <div className="w-full h-full absolute top-0 left-0 bg-white/75 z-[100] grid place-items-center">
          <div className="font-semibold flex flex-col gap-2 items-center justify-center">
            <p>Please signin to use this feature</p>
            <Button
              variant="primary"
              size="small"
              onClick={() => (window.location.href = '/auth/signin')}
            >
              Sign In{' '}
            </Button>
          </div>
        </div>
      )}
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

      {error && (
        <p className="text-red-900 text-sm bg-red-50 border border-red-200 p-2 rounded">{error}</p>
      )}

      <div className="py-4 grid gap-2">
        <Input
          type="text"
          name="url"
          value={url}
          onChange={updateUrl}
          placeholder="Enter one or more URLs (comma, space or newline separated)"
        />
        <Button
          variant="primary"
          size="small"
          onClick={extractDescriptions}
          disabled={loading}
          className={loading ? 'animate-pulse' : ''}
        >
          {loading ? 'Extracting…' : 'Extract'}
        </Button>
      </div>

      <textarea
        onChange={updateJobDescription}
        value={jobDescription}
        placeholder="Paste or extract a job description..."
        className="w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y"
      />

      <Button
        variant="primary"
        size="small"
        onClick={startAnalysis}
        disabled={analyzing}
        className={analyzing ? 'animate-pulse' : ''}
      >
        {analyzing ? 'Analyzing…' : 'Analyse'}
      </Button>
    </div>
  );
};

export default JobDescription;
