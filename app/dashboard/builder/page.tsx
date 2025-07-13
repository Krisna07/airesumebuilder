'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MultiStepForm from '@/components/Forms/MultiStepForm';
import { ResumeData } from '@/types/types';
import Button from '@/components/Button';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';


// Dynamically import ResumeUpload to avoid SSR issues
const ResumeUpload = dynamic(() => import('@/components/ResumeUpload'), {
  ssr: false,
  loading: () => <div className='flex items-center justify-center p-8'>Loading...</div>
});

function BuilderContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const resumeId = searchParams?.get('resumeId');

  // Wrap user initialization in useMemo to prevent unnecessary re-renders
  const user = useMemo(() => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      email: authUser.email
    };
  }, [authUser]); // Include authUser in the dependency array

  const [manual, setManual] = useState<boolean>(false);
  const [resumeContent, setResumeContent] = useState<ResumeData>({
    profile: {
      fullname: '',
      email: '',
      phone: '',
      location: '',
      links: [
        {
          type: '',
          url: ''
        }
      ],
      summary: ''
    },
    skills: [],
    experience: [
      {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: []
      }
    ],
    education: [
      {
        degree: '',
        university: '',
        startDate: '',
        location: '',
        current: false
      }
    ],
    certificates: []
  });
  const [jobDescription, setJobDescription] = useState<string>('');
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const response = await fetch(`/api/resume/${resumeId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch resume');
          }
          const data = await response.json();
          setResumeContent(data.resume);
          setCurrentResumeId(resumeId);
          setLastSaved(new Date(data.resume.updatedAt));
          setManual(true);
        } catch (error) {
          console.error('Error fetching resume:', error);
        }
      };
      fetchResume();
    }
  }, [resumeId]);

  // Load from localStorage on mount if no resumeId
  useEffect(() => {
    if (!resumeId && user) {
      const cacheKey = `resume_cache_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { resumeContent: cachedContent, jobDescription: cachedJob, resumeId: cachedId } = JSON.parse(cached);
          if (cachedContent.profile.fullname) {
            setResumeContent(cachedContent);
            setJobDescription(cachedJob || '');
            setCurrentResumeId(cachedId);
            setManual(true);
          }
        } catch (error) {
          console.error('Error loading cached resume:', error);
        }
      }
    }
  }, [resumeId, user]);

  // Save resume to database
  const saveResume = async (data: ResumeData, description: string = '') => {
    if (!user) return null;

    setIsSaving(true);
    setSaveError(null);

    try {
      const url = currentResumeId ? `/api/resume/${currentResumeId}` : '/api/resume';
      const method = currentResumeId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: data.profile,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          certificates: data.certificates,
          jobDescription: description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const result = await response.json();
      const savedResumeId = result.resume.id;

      setCurrentResumeId(savedResumeId);
      setLastSaved(new Date());
      setIsDirty(false);

      // Update URL if this was a new resume
      if (!currentResumeId) {
        const newUrl = `/dashboard/builder?resumeId=${savedResumeId}`;
        window.history.replaceState({}, '', newUrl);
      }

      return savedResumeId;
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save resume');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateJobDescription = (jobAd: string) => {
    setJobDescription(jobAd);
    setIsDirty(true);
  };

  const updateResumeContent = (data: ResumeData) => {
    setResumeContent(data);
    setIsDirty(true);
    setManual(true);
  };

  if (authLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-black'></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='min-w-full min-h-screen grid place-items-center '>
      {/* Save Status Indicator */}
      {(manual || resumeContent.profile.fullname) && (
        <div className='fixed top-4 right-4 z-50'>
          <div className='bg-white border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2'>
            {isSaving ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                <span className='text-sm text-gray-600'>Saving...</span>
              </>
            ) : saveError ? (
              <>
                <div className='w-4 h-4 bg-red-500 rounded-full'></div>
                <span className='text-sm text-red-600'>Save failed</span>
              </>
            ) : isDirty ? (
              <>
                <div className='w-4 h-4 bg-yellow-500 rounded-full'></div>
                <span className='text-sm text-gray-600'>Unsaved changes</span>
              </>
            ) : lastSaved ? (
              <>
                <div className='w-4 h-4 bg-green-500 rounded-full'></div>
                <span className='text-sm text-gray-600'>Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : null}
          </div>
        </div>
      )}

      {!manual && (
        <div className={`relative grid place-items-center overflow-hidden p-1 rounded-lg`}>
          <div className='relative bg-white hover:shadow-lg p-4 gap-2 w-fit rounded-lg grid ring-1 transition-all ease-in-out duration-300'>
            <label htmlFor='resume-upload' className='block text-lg font-semibold mb-2 font-[Bebas Neue]'>
              Get started with your resume
            </label>
            <div className='min-w-full grid place-items-center'>
              <div className='border-dashed relative w-full   grid place-items-center transition-all ease-out'>
                <ResumeUpload handleResumeDataUpdate={updateResumeContent} />
              </div>
            </div>
            <Button variant={'primary'} size={'small'} onClick={() => setManual(true)}>
              Add Manual Data
            </Button>
          </div>
        </div>
      )}
      {(resumeContent.profile.fullname || manual) && (
        <MultiStepForm
          resumeContent={resumeContent}
          handleJobDescription={updateJobDescription}
          handleResumeDataUpdate={updateResumeContent}
          jobDescription={jobDescription}
          onSave={saveResume}
          isSaving={isSaving}
          isDirty={isDirty}
          saveError={saveError}
        />
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-black'></div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
