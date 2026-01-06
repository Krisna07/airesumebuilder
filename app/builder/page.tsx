'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { File, Plus, Rocket, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { useRouter } from 'next/navigation';
import { ResumeData } from '@/types/types';
import GuestUser from '@/components/BuilderComponents/GuestUser';
import { PreviewContainer } from '@/components/BuilderComponents/PreviewContainer';
import LoadingResumeState from '@/components/BuilderComponents/LoadingResumeState';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify'


const Page = () => {
  const { user, loading } = useAuth();
  const [resumes, setResumes] = useState<ResumeData[] | null>(null);
  const [creating, setCreating] = useState(false);
  // let action: boolean = false
  const router = useRouter();

  const response = useQuery({
    queryKey: ['resumeData'],
    queryFn: () => ResumeService.getAll(user ? user.id : null)
  })

  useEffect(() => {
    if (response.isSuccess && response.data && !response.isPending) {
      setResumes(response.data);
    }
    if (response.isError) {
      toast.error(response.error.message)
    }
    return
  }, [response]);



  if (response.isPending) {
    return <LoadingResumeState />
  }

  if (user && !response.isPending) {
    const handleCreateResume = async () => {
      setCreating(true);
      try {
        const response = await ResumeService.create(user.id);
        const data = await response.json();
        if (!response.ok) {
          toast.error(response.statusText);
          return;
        }
        router.push(`/builder/${data.data.id}`); // Fixed: using router instead of route
        toast.success('Resume created successfully');
      } catch (error) {
        console.error('Error creating resume:', error);
        toast('Error creating resume');
      } finally {
        setCreating(false);
      }
    };

    const handleResumeDeleted = async () => {
      await response.refetch()
    // setResumes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    };

    return (
      <section className='w-full flex items-center justify-center '>
        <div className={`p-4 w-full min-[850px]:w-[850px]   ${resumes && resumes.length ? 'place-self-start' : 'md:place-self-end'}   transition-opacity duration-300 anim-fade-in-soft`}>
          {resumes && resumes.length ? (
            <>
              <div className='w-full flex items-center justify-between  '>
                <h3 className='w-full text-left font-medium text-2xl border-b border-gray-400 mb-4'>
                  All Resumes <span className='font-bold text-[12px]'>{resumes.length} in total</span>
                </h3>
              </div>
              <div className='w-full h-fit grid grid-cols-3 max-[500px]:grid-cols-2 gap-4 items-start justify-center mb-16'>
                {resumes.map((resume, index) => (
                  <PreviewContainer
                    resume={resume}
                    index={index}
                    key={resume.id}
                    onDeleted={handleResumeDeleted}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
                {response.isPending ? (
                <div className='grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='h-[300px] max-w-[250px] w-full rounded-2xl shadow-inner bg-gray-100 skeleton-shimmer' />
                  ))}
                </div>
              ) : (
                <div className='text-center mb-6 px-4'>
                  <h1 className='text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2'>
                        Let&apos;s get started <Rocket className='animate-pulse' />
                  </h1>
                      <p className='text-gray-600 max-w-md mx-auto'>
                        Create your first resume to begin. You can always add, edit, preview or delete drafts later.
                      </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className='w-full grid place-items-center place-self-end md:place-self-start  p-4 gap-2 fixed bottom-0 bg-white'>
          <div className='flex gap-2 items-center'>
            <Button
              variant='primary'
              size='medium'
              onClick={handleCreateResume}
              disabled={creating}
              className={`${creating ? 'animate-pulse' : ''}`}
            >
              {creating ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' /> Creating...
                </span>
              ) : (
                <span className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' /> Add New
                </span>
              )}
            </Button>
            <Link href={'/builder/build'} className='flex-1'>
              <Button variant='secondary' size='medium'>
                <File /> Upload Existing PDF
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user && !loading) {
    return (
      <section className='w-full min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center anim-fade-in-soft'>
        <div className='space-y-2 max-w-md'>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight text-gray-900'>
            Create Your First AI‑Ready Resume
          </h1>
          <p className='text-gray-600 text-sm md:text-base leading-relaxed'>
            Sign in to build, analyze and optimize resumes with automated job description matching.
          </p>
        </div>
        <GuestUser />
      </section>
    );
  }

  return null; // Fallback return
};

export default Page;
