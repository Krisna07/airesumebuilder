'use client';
import Button from '@/components/Button';
import Link from 'next/link';
import React, { useState } from 'react';
import { ResumeStorage } from '@/lib/resume-storage';
import ResumeList from '@/components/ResumeList';

const Page = () => {
  const [showResumeList, setShowResumeList] = useState(false);

  const createNewResume = () => {
    const uuid = ResumeStorage.create();
    window.location.href = `/builder/${uuid}`;
  };

  if (showResumeList) {
    return (
      <section className='w-full min-h-[60vh] p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6'>
            <Button variant='secondary' size='small' onClick={() => setShowResumeList(false)}>
              ← Back
            </Button>
          </div>
          <ResumeList />
        </div>
      </section>
    );
  }

  return (
    <section className='w-full min-h-[60vh] sm:h-full grid place-items-center justify-center'>
      <div className='place-items-center gap-4 grid'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Resume Builder</h1>
          <p className='text-gray-600'>Create a new resume or work with existing ones</p>
        </div>
        
        <div className='flex flex-col gap-3 w-full max-w-sm'>
          <Button variant='primary' size='medium' onClick={createNewResume}>
            Create New Resume
          </Button>
          <Button variant='secondary' size='medium' onClick={() => setShowResumeList(true)}>
            View My Resumes
          </Button>
          <Link href={'/builder/build'}>
            <Button variant='secondary' size='medium' className='w-full'>
              Upload Existing PDF
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Page;
