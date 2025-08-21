'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React from 'react';
import { File, Grid, Rocket } from 'lucide-react';
import { createResume } from '@/services/resumeServices';

const Page = () => {
  return (
    <section className='w-full min-h-[80vh] sm:h-full grid place-items-center justify-center'>
      <div className='place-items-center gap-4 grid'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2  text-center flex items-center justify-center gap-2 '>
            Lets get started <Rocket className='animate-pulse' />
          </h1>
          <p className='text-gray-600'>Create a new resume or work with existing ones</p>
        </div>

        <div className='flex flex-col gap-3 w-full items-center'>
          <Button variant='primary' size='medium' onClick={createResume}>
            Create New Resume
          </Button>
          <div className='flex gap-4 '>
            <Button variant='secondary' size='medium' onClick={() => (window.location.href = `/myresumes`)}>
              <Grid /> View My Resumes
            </Button>
            <Link href={'/builder/build'}>
              <Button variant='secondary' size='medium' className='w-full'>
                <File /> Upload Existing PDF
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;
