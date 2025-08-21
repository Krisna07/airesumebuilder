'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MultiStepForm from '@/components/Forms/MultiStepForm';
import { ResumeData } from '@/types/types';
import { ResumeStorage } from '@/lib/resume-storage';

const BuilderPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    if (typeof window === 'undefined') return; // SSR guard

    // Try to load resume data from ResumeStorage
    const stored = ResumeStorage.load(slug);

    if (stored) {
      setResumeData(stored.resumeData);
    } else {
      // No data found for this UUID, redirect to builder
      console.warn('No resume data found for UUID:', slug);
      window.location.href = '/builder';
      return;
    }

    setLoading(false);
  }, [slug]);

  if (loading) {
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
    if (typeof window !== 'undefined') {
      return (
        <div className='w-full min-h-[60vh] flex items-center justify-center'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>Resume Not Found</h2>
            <p className='text-gray-600 mb-6'>The resume you&#39;re looking for doesn&#39;t exist or has been deleted.</p>
            <button onClick={() => (window.location.href = '/builder')} className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
              Back to Builder
            </button>
          </div>
        </div>
      );
    } else {
      // SSR fallback
      return null;
    }
  }

  return (
    <div className='w-full'>
      <MultiStepForm resumeContent={resumeData} resumeId={slug} />
    </div>
  );
};

export default BuilderPage;
