'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { File, Plus, Rocket, User } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';
import ResumePreview from '@/components/Templates/ResumePreview';

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
      const fetchAllResume = async () => {
        const response = await ResumeService.getAll(user.id);
        const data = await response.json();
        if (!response.ok) {
          toast.showToast(response.statusText, 'error', 3000);
          return setResumes([]);
        }
        setResumes(data.data);
      };
      fetchAllResume();
    }
  }, [user]);

  if (loading) {
    return (
      <section className="w-full grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </section>
    );
  }
  if (user) {
    const handleCreateResume = async () => {
      const response = await ResumeService.create(user.id);
      const data = await response.json();
      if (!response.ok) {
        toast.showToast(response.statusText, 'error', 3000);
        return;
      }
      return (window.location.href = `/builder/${data.data.id}`);
    };
    return (
      <section className=" min-h-[80vh] sm:h-full w-full ">
        <div className="w-full h-full grid place-items-center gap-4  ">
          {resumes?.length ? (
            <>
              <div className="w-full flex items-center justify-between   px-4">
                <h3 className="w-full text-left font-medium text-3xl">
                  All Resumes <span className="font-bold text-[12px]">{resumes.length}</span>
                </h3>
              </div>
              <div className="min-[1000px]:w-[1000px] w-full h-fit grid grid-cols-2 md:grid-cols-3 gap-2 px-4">
                {resumes.map((resume, index) => (
                  <div
                    key={index}
                    tabIndex={0} /* allows focus on tap for mobile */
                    className="h-[300px] overflow-hidden grid place-items-center rounded-2xl shadow-[0_0_4px_0_gray] select-none relative group cursor-pointer"
                  >
                    <div className="w-full h-full select-none absolute -z-10 transition-all duration-300 group-hover:blur-sm group-focus-within:blur-sm">
                      <ResumePreview resumeId={resume.id} template={resume.template} />
                    </div>
                    <div className="flex gap-2 relative -bottom-[100%] transition-all ease-in-out duration-500 group-hover:bottom-0 group-focus-within:bottom-0">
                      <Button
                        onClick={() => (window.location.href = `/builder/${resume?.id}/preview`)}
                        variant="primary"
                        size="small"
                      >
                        Preview
                      </Button>
                      <Button
                        onClick={() => (window.location.href = `/builder/${resume?.id}`)}
                        variant="secondary"
                        size="small"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2  text-center flex items-center justify-center gap-2 ">
                Lets get started <Rocket className="animate-pulse" />
              </h1>
              <p className="text-gray-600">Create a new resume or work with existing ones</p>
            </div>
          )}

          <div className="flex  gap-3 w-full items-center justify-center sticky bottom-0 bg-white p-2 md:relative">
            <Button variant="primary" size="medium" onClick={handleCreateResume}>
              <Plus /> Add New
            </Button>
            <Link href={'/builder/build'}>
              <Button variant="secondary" size="medium" className="w-full">
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
      <section className="grid place-items-center gap-2">
        Hello Stranger, Please sign in to start creating the resume
        <Link href={'/auth/signin'}>
          <Button variant="primary" size="medium">
            Be a member <User size="16" />
          </Button>
        </Link>
      </section>
    );
  }
};

export default Page;
