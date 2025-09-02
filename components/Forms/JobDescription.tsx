import React, {  useState } from "react";
import { AnalysisResult } from '@/types/types';
import Input from '../Input';

// import scrapeWebsite from "@/lib/scrape";
import Button from '../UI/Button';
import { getJobDescription, analyzeResume } from '@/services/resumeServices';

interface Props { resumeId?: string }
const JobDescription: React.FC<Props> = ({ resumeId }) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  interface ScrapeResult { url: string; success: boolean; description?: string; title?: string; company?: string; location?: string; error?: string; domain?: string; }
  const [rawResults, setRawResults] = useState<ScrapeResult[]>([]);
  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setJobDescription(e.target.value);
  };
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const startAnalysis = async () => {
    if (!jobDescription) {
      return setError('No job description');
    }
    if (!resumeId) {
      return setError('Missing resume id');
    }
    setAnalyzing(true);
    setError(null);
    const result = await analyzeResume(resumeId, jobDescription, true);
    setAnalyzing(false);
    if (result.status !== 200) {
      setError(result.error || 'Failed to analyze');
      return;
    }
    setAnalysis(result.analysis);
  };

  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  const [loading, setLoading] = useState(false);

  interface JDMeta { count: number; succeeded: number; failed: number }
  interface JDResult { status: number; description?: string; raw?: ScrapeResult[]; blocked?: boolean; message?: string; meta?: JDMeta }
  const extractDescriptions = async () => {
    setError(null);
    setRawResults([]);
    const trimmed = url.trim();
    if (!trimmed) {
      return setError('Enter at least one URL');
    }
    // Allow multiple URLs separated by commas / spaces / newlines
    const candidates = trimmed.split(/[,\s]+/).filter(Boolean);
    const valid = candidates.filter(u => /^https?:\/\//i.test(u));
    if (!valid.length) {
      return setError('No valid URL detected');
    }
    setLoading(true);
  const result = await getJobDescription(valid) as JDResult;
    setLoading(false);
    if (result.status !== 200) {
      setError(result.message || 'Failed to fetch description');
      return;
    }
  if (result.blocked) {
      setError(result.message || 'Site blocked automated scraping. Please paste manually.');
    }
    setJobDescription(result.description || '');
  setRawResults(result.raw || []);
  };

  return (
    <div className='w-full p-2'>
      {analysis && (
        <div className='mb-4 rounded border border-sky-200 bg-sky-50 p-3 text-xs space-y-2'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='font-semibold text-sky-800'>Match: {Math.round(analysis.matchingPercentage)}%</span>
            {analysis.role && <span className='rounded bg-white px-2 py-0.5 border text-[10px] font-medium text-sky-700'>{analysis.role}</span>}
          </div>
          {analysis.description && <p className='text-sky-900 leading-snug'>{analysis.description}</p>}
          {analysis.suggestions?.length > 0 && (
            <div>
              <p className='font-medium text-sky-800 mb-1'>Suggestions</p>
              <ul className='list-disc ml-5 space-y-0.5 marker:text-sky-500'>
                {analysis.suggestions.slice(0,6).map((s,i)=>(<li key={i}>{s}</li>))}
              </ul>
            </div>
          )}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {analysis.strengths?.length ? (
              <div>
                <p className='font-medium text-green-700 mb-1'>Strengths</p>
                <ul className='list-disc ml-5 space-y-0.5 marker:text-green-500'>
                  {analysis.strengths.slice(0,5).map((s,i)=>(<li key={i}>{s}</li>))}
                </ul>
              </div>
            ): null}
            {analysis.missingKeywords?.length ? (
              <div>
                <p className='font-medium text-amber-700 mb-1'>Missing Keywords</p>
                <div className='flex flex-wrap gap-1'>
                  {analysis.missingKeywords.slice(0,12).map((k,i)=>(<span key={i} className='px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px]'>{k}</span>))}
                </div>
              </div>
            ): null}
          </div>
        </div>
      )}
  {error && <p className='text-red-900 text-sm bg-red-50 border border-red-200 p-2 rounded'>{error}</p>}
      <div className='py-4 grid gap-2'>
        {/* <h2>Extract the content from url</h2> */}
        <Input type={'text'} name={'url'} value={url} onChange={updateUrl} placeholder={'Enter one or more URLs (comma, space or newline separated)'} />
        <Button variant={'primary'} size={'small'} onClick={extractDescriptions} disabled={loading} className={loading ? 'animate-pulse' : ''}>
          {loading ? 'Extracting…' : 'Extract'}
        </Button>
      </div>
      <textarea
        onChange={updateJobDescription}
        value={jobDescription}
        placeholder='Paste or extract a job description...'
        className='w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y'
      />
      {rawResults.length > 0 && (
        <details className='mt-3 text-xs text-gray-600 cursor-pointer select-none'>
          <summary className='font-medium'>Raw scrape results ({rawResults.length})</summary>
          <pre className='max-h-56 overflow-auto bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap'>{JSON.stringify(rawResults, null, 2)}</pre>
        </details>
      )}
      <Button variant={'primary'} size={'small'} onClick={startAnalysis} disabled={analyzing} className={analyzing ? 'animate-pulse' : ''}>
        {analyzing ? 'Analyzing…' : 'Analyse'}
      </Button>
    </div>
  );
};

export default JobDescription;
