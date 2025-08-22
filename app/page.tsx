import Button from '@/components/UI/Button';
import Link from 'next/link';
import React from 'react';

const page = () => {
  return (
    <div className='w-full max-w-4xl text-center flex flex-col items-center gap-8 justify-center min-h-[60vh] px-4'>
      <div className='space-y-4'>
        <h1 className='text-4xl md:text-5xl font-bold text-gray-900'>AI Resume Builder</h1>
        <p className='text-xl text-gray-600 max-w-2xl'>Create professional resumes that beat ATS systems and match AI-generated job listings. Choose from modern, classic, or minimal templates.</p>
      </div>

      <div className='flex flex-col sm:flex-row gap-4 items-center'>
        <Link href={'./builder'}>
          <Button variant='primary' size='large'>
            Start Building
          </Button>
        </Link>
        {/* <Link href={'./templates'}>
          <Button variant='secondary' size='large'>
            View Templates
          </Button>
        </Link> */}
      </div>

      {/* Feature highlights */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full'>
        <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
          <div className='text-3xl mb-3'>🎨</div>
          <h3 className='font-semibold text-gray-800 mb-2'>Modern Templates</h3>
          <p className='text-gray-600 text-sm'>Choose from professionally designed templates</p>
        </div>
        <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
          <div className='text-3xl mb-3'>🤖</div>
          <h3 className='font-semibold text-gray-800 mb-2'>AI-Powered</h3>
          <p className='text-gray-600 text-sm'>Optimize your resume with AI assistance</p>
        </div>
        <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
          <div className='text-3xl mb-3'>📄</div>
          <h3 className='font-semibold text-gray-800 mb-2'>ATS-Friendly</h3>
          <p className='text-gray-600 text-sm'>Beat applicant tracking systems</p>
        </div>
      </div>
    </div>
  );
};

export default page;
