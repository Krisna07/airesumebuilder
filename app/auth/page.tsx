'use client';
import { useAuth } from '@/context/authContext';

const Page = () => {
  const { user } = useAuth();
  if (user) {
    return (window.location.href = '/builder');
  } else {
    return (window.location.href = '/auth/signin');
  }
};

export default Page;
