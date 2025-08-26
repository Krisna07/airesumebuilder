'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';

const Page = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.href = '/builder';
    } else {
      window.location.href = '/auth/signin';
    }
  }, [user]);

  return <div className='text-6xl animate-pulse'>REDIRECTING....</div>;
};

export default Page;
