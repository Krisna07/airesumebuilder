import Button from '@/components/Button';
import Link from 'next/link';
import React from 'react';

const page = () => {
  return (
    <section className='w-full min-h-[60vh] sm:h-full  grid place-items-center justify-center'>
      <div className='place-items-center gap-2 grid'>
        <Button variant='secondary' size='medium' >
          New Resume
        </Button>
        <Link href={'/builder/build'}><Button variant='primary' size='medium'>
          Start With Existing
        </Button></Link>
      </div>
    </section>
  );
};

export default page;
