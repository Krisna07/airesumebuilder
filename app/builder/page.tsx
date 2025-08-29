'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { File, Plus, Rocket, User } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';

interface AllReturnedResume {
  id: string;
  template: string;
  title: string;
  updatedAt: string;
}
const Page = () => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [resumes, setResumes] = useState<AllReturnedResume[]>([]);

  useEffect(() => {
    if (user) {
      ResumeService.getAll(user.id).then((res) => {
        if (res.error) {
          return console.log(res.error);
        }
        console.log(res);
        setResumes(res);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <section className='w-full grid place-items-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
      </section>
    );
  }
  if (user) {
    const handleCreateResume = async () => {
      const response = await ResumeService.create(user.id);
      if (response.error) {
        toast.showToast(response.error, 'error', 3000);
      }
      return (window.location.href = `/builder/${response.data.id}`);
    };
    return (
      <section className='w-full min-h-[80vh] sm:h-full grid place-items-center justify-center'>
        <div className='place-items-center gap-4 grid'>
          {resumes?.length ? (
            <>
              <h3 className='w-full text-left font-medium text-3xl'>Resumes</h3>
              <div className='w-full h-fit  md:flex  grid gap-2 flex-wrap'>
                {resumes.map((resume, index: number) => (
                  <div
                    key={index}
                    onClick={() => (window.location.href = `/builder/${resume?.id}`)}
                    className='min-w-[200px] h-64 shadow-[0_0_2px_0_gray] grid place-items-center rounded-br-3xl rounded-2xl hover:scale-[1.02] transition-all ease-in-out'
                  >
                    <iframe className='w-full h-full'></iframe>
                    <span className='first-letter:uppercase'>{resume.template}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='text-center mb-6'>
              <h1 className='text-2xl font-bold text-gray-900 mb-2  text-center flex items-center justify-center gap-2 '>
                Lets get started <Rocket className='animate-pulse' />
              </h1>
              <p className='text-gray-600'>Create a new resume or work with existing ones</p>
            </div>
          )}

          <div className='flex flex-col min-[500px]:flex-row gap-3 w-full items-center justify-center'>
            <Button variant='primary' size='medium' onClick={handleCreateResume}>
              <Plus /> Create New Resume
            </Button>
            <Link href={'/builder/build'}>
              <Button variant='secondary' size='medium' className='w-full'>
                <File /> Upload Existing PDF
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user && loading == false) {
    return (
      <section className='grid place-items-center gap-2'>
        Hello Stranger, You have wondered too far, Be a member of Resume Gang
        <Link href={'/auth/signin'}>
          <Button variant='primary' size='medium'>
            Be a member <User size='16' />
          </Button>
        </Link>
      </section>
    );
  }
};

export default Page;
