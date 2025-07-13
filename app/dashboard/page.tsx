'use client';

import ResumeList from '@/components/ResumeList';
import { useAuth } from '@/context/AuthContext';

import { FaRobot } from 'react-icons/fa6';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  // Show loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  // Show sign-in prompt if no user
  if (!loading && !user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600 mb-4'>Please sign in to access the dashboard</p>
          <a href='/auth/signin' className='text-blue-600 hover:underline'>
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className='grid gap-4 mx-4'>
      <div className='grid gap-2'>
        <div className='text-sm font-semibold capitalize flex items-center gap-2'>
          <div style={{ background: user?.avatar }} className={`w-6 h-6 rounded-full`}></div>
          Welcome, {user?.email?.split('@')[0] || 'User'}
        </div>
        <div className='text-sm bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-orange-600/20 animate-gradient-shift w-fit pr-4 px-2 rounded-full flex items-center gap-2 font-semibold text-gray-800'>
          <div className='min-w-[8px] min-h-[8px] bg-green-500 animate-pulse rounded-full'></div>
          Create Your Personalise Resume with AI
          <FaRobot />
        </div>
      </div>
      <main>
        <ResumeList />
      </main>
    </div>
  );
}
