'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MultiStepForm from '@/components/Forms/MultiStepForm';
import { ResumeData } from '@/types/types';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import { useGetResume } from '@/hooks/useResume';

const BuilderPage: React.FC = () => {
  const params = useParams();
  const slug = (params?.slug ?? "") as string;
  const [resumeData, setResumeData] = useState<ResumeData>();
  const { user } = useAuth();
  const response = useGetResume(slug)
  const { showToast } = useToast()

  useEffect(() => {
    if (!slug) return;
      if (slug === 'guest-resume') {
        console.log(slug);
        const localResume = localStorage.getItem(slug);
        console.log(JSON.parse(localResume ? localResume : ''));
        if (localResume) {
          setResumeData(JSON.parse(localResume));
          return;
        }
      }
    if (response.error) {
      showToast(response.error.message, 'error', 3000)
    }

    if (response.data) {
      setResumeData(response.data)
    }
  }, [slug, response, response.error, showToast]);

  if (response.isLoading) {
    return (
      <div className='w-full min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your resume...</p>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className='w-full min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>You have wondered to an abyss. Please get back</h2>
          <p className='text-gray-600 mb-6'>The resume you&#39;re looking for doesn&#39;t exist or has been deleted.</p>
          <button onClick={() => (window.location.href = '/builder')} className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <MultiStepForm resumeContent={resumeData} resumeId={slug} userId={user ? user.id : ''} />
  );
};

export default BuilderPage;
