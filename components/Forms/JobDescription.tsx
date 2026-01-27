/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import Input from '../Input';
import Button from '../Ui/Button';
import { getJobDescription, JobDescriptionService } from '@/services/jdServices';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import JobDecriptionAnalysis from '../Ui/jobDecriptionAnalysis';
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
  const [extracting, setExtracting] = useState(false)
  const [extractingFromText, setExtractingFromText] = useState(false)
  const [textField, setTextField] = useState<boolean>(false)
  const { user } = useAuth()
  const { showToast } = useToast()
  const userId: string = user?.id ?? ''

  const triggerTextField = () => {
    setTextField(!textField)
  }

  const response = useJobDescriptions(userId, resumeId);
  // shallow compare job details by id to avoid unnecessary state updates
  const sameJobDetails = (a?: JobDetailsWithAnalysis[], b?: JobDetailsWithAnalysis[]) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if ((a[i] as any).id !== (b[i] as any).id) return false;
    }
    return true;
  }

  useEffect(() => {
    // if disabled or no user, prefer local stored descriptions
    if ((disabled || !userId) && resumeId) {
      const localDescriptions = JobDescriptionService.getLocal(resumeId)
      if (localDescriptions.length) {
        if (!sameJobDetails(jobDetails, localDescriptions)) setJobDetails(localDescriptions)
      }
      return;
    }

    // If server suggests paste mode
    if (response.data?.status === 202) {
      if (!textField) setTextField(true);
      return;
    }

    // Only update when query reports success and data changed
    if (response.isSuccess) {
      const incoming = response.data?.data as JobDetailsWithAnalysis[] | undefined;
      if (!sameJobDetails(jobDetails, incoming)) setJobDetails(incoming)
    }
    // Only watch stable flags rather than the whole response object
  }, [disabled, resumeId, userId, response.isSuccess, response.data?.status, response.refetch]);

  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value);
  };



  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const extractDescriptions = async () => {

    const userId = user?.id;
    const trimmed = url.trim();
    if (!trimmed) {
      showToast('Enter at least one URL', 'warning');
      setExtracting(false)
      return;
    }
    const candidates = trimmed.split(/[,\s]+/).filter(Boolean);
    const valid = candidates.filter(u => /^https?:\/\//i.test(u));
    if (!valid.length) {
      showToast('No valid URL detected', 'warning');
      return;
    }

    try {
      const result = await getJobDescription(valid);
      if ((disabled || !userId) && resumeId) {
        showToast(result.message || 'Failed to fetch description', 'error');
        return;
      }
      if (result.blocked) {
        showToast(result.message || 'Site blocked automated scraping. Please paste manually.', 'error');
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
          showToast('Uh oh! there is some error saving data', 'error')
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
      await response.refetch()

    } catch (err: any) {
      console.error('extractDescriptions error', err);
      showToast(err?.message || 'Failed to extract descriptions', 'error');
    } finally {
      setExtracting(false);

    }
  }

  const extractFromPastedText = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) {
      showToast('Please paste job description text first', 'warning');
      return;
    }

    if (trimmed.length < 50) {
      showToast('Job description seems too short. Please paste complete text.', 'warning');
      return;
    }

    setExtractingFromText(true);

    try {
      const aiResponse = await fetch('/api/ai/extract-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: trimmed })
      });

      const result = await aiResponse.json();

      if (!aiResponse.ok) {
        if (result.quotaExceeded) {
          showToast('Daily AI extraction limit reached. Please upgrade your plan.', 'error');
        } else {
          showToast(result.error || 'Failed to extract job details', 'error');
        }
        return;
      }

      if (!result.success || !result.data) {
        showToast('Could not extract job details from text', 'error');
        return;
      }

      // Save extracted job details
      const extractedJob = result.data;

      if (disabled || !userId) {
        if (resumeId) {
          const saved = await JobDescriptionService.saveLocal(resumeId, extractedJob);
          setJobDetails(prev => {
            const merged = [...(prev || []), saved];
            const map = new Map<string, any>(
              merged.map((j: any) => [j && j.id ? String(j.id) : JSON.stringify(j), j])
            );
            return Array.from(map.values());
          });
          showToast('Job description extracted and saved locally!', 'success');
          setJobDescription('');
          setTextField(false);
        }
      } else {
        if (!resumeId) {
          showToast('No resume ID found', 'error');
          return;
        }

        const saveResponse = await JobDescriptionService.save(resumeId, userId, extractedJob);

        if (!saveResponse.ok) {
          showToast('Failed to save extracted job details', 'error');
          return;
        }

        const savedData = await saveResponse.json();
        setJobDetails(prev => {
          const merged = [...(prev || []), savedData.data];
          const map = new Map<string, any>(
            merged.map((j: any) => [j && j.id ? String(j.id) : JSON.stringify(j), j])
          );
          return Array.from(map.values());
        });

        await response.refetch();
        showToast('Job description extracted and saved!', 'success');
        setJobDescription('');
        setTextField(false);
      }
    } catch (err: any) {
      console.error('Extract from text error:', err);
      showToast(err?.message || 'Failed to extract job details', 'error');
    } finally {
      setExtractingFromText(false);
    }
  };
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
          disabled={extracting}
          className={extracting ? 'animate-pulse' : ''}
        >
          {extracting ? 'Extracting…' : 'Extract'}
        </Button>
          {!hideAnalysis && <Button
            variant="secondary"
            size="small"
            onClick={() => triggerTextField()}
            disabled={extracting}
            className={extracting ? 'animate-pulse' : ''}
          >
            {textField ? 'Hide' : 'Paste Description'}
          </Button>}

        </div>
      </div>}
      {response.isLoading && <div className='flex items-center gap-2 animate-pulse'>Loading available job details  <div className='animate-bounce'><FaSpinner className='text-4xl animate-spin ' /></div></div>}

      <div className='relative'>
        {
          textField &&
          <div className="w-full grid gap-2">
              <textarea
                onChange={updateJobDescription}
                value={jobDescription}
                placeholder="Paste job description text here (title, company, location, requirements, etc.)..."
                className="w-full min-h-[220px] border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 resize-y"
              />
              <div className="flex gap-2 items-center justify-end">
                <Button
                  variant="primary"
                  size="small"
                  onClick={extractFromPastedText}
                  disabled={extractingFromText || !jobDescription.trim()}
                  className={extractingFromText ? 'animate-pulse' : ''}
                >
                  {extractingFromText ? 'Extracting with AI…' : '✨ Extract & Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    setJobDescription('');
                    setTextField(false);
                  }}
                  disabled={extractingFromText}
                >
                  Cancel
                </Button>
              </div>
            </div>
        }

        {jobDetails && jobDetails.length > 0 && (
          <div className="w-full mt-2 grid gap-4  ">
            {!hideAnalysis && <div>
              <h3 className="text-lg font-semibold mb-3  flex items-center gap-2"><BugIcon size={16} /> Reports </h3>
              {jobDetails && jobDetails.filter((jd) => jd.hasAnalysed).sort().map((job: JobDetailsWithAnalysis, count: number) =>
                <JobDecriptionAnalysis key={count} job={job} resumeId={resumeId} response={response} />
              )}
            </div>}

            <div>
              {!hideTitle && <h3 className="text-lg font-semibold mb-3 ">Available Job Description</h3>}
              {jobDetails && jobDetails.filter((jd) => !jd.hasAnalysed).map((job: JobDetailsWithAnalysis, count: number) =>
                <JobDecriptionAnalysis response={response} key={count} job={job} resumeId={resumeId} handleRegenerate={handleRegenerate} resumeData={resumeData} />
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
