import Button from '@/components/Button';
import Link from 'next/link';
import React from 'react';

const page = () => {
  return (
    <div className='w-[60ch] h-[60vh] text-center text-2xl flex flex-col items-center  gap-4 justify-center  '>
      <p>Lets get started with new resume app of the year. Taylor your resume beating ATS system and matching those ai generated job listing.</p>
      <Link href={'./builder'}>
        <Button variant='primary' size='large'>
          Start Building
        </Button>
      </Link>
    </div>
  );
};

export default page;
