'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { File, Plus, Rocket, User } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useRouter } from 'next/navigation';
import { ResumeData } from '@/types/types';

// interface AllReturnedResume {
//   id: string;
//   template: string;
//   title: string;
//   updatedAt: string;
// }
const Page = () => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [creating, setCreating] = useState<boolean>(false);
  const [loadingResume, setLoadingResume] = useState<boolean>(false)
  const route = useRouter()

  useEffect(() => {
    if (user) {
      const fetchAllResume = async () => {
        setLoadingResume(true)
        const response = await ResumeService.getAll(user.id);
        const data = await response.json();
        if (!response.ok) {
          toast.showToast(response.statusText, 'error', 3000);
           setResumes([]);
          return setLoadingResume(false)
        }
        setResumes(data.data);
        return setLoadingResume(false)
      };
      fetchAllResume();
    }
  }, [user]);

  if (loading || loadingResume) {
    return (
      <section className="w-full grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </section>
    );
  }
  if (user) {
    const handleCreateResume = async () => {
      setCreating(true)
      const response = await ResumeService.create(user.id);
      const data = await response.json();
      if (!response.ok) {
        toast.showToast(response.statusText, 'error', 3000);
        return setCreating(false);
      }
      route.push(`/builder/${data.data.id}`);
      toast.showToast("Resume created successfully", 'success', 3000);
      setCreating(false);
    };

      // Minimum data check
  const hasMinimumData =(resume:ResumeData)=>{
      if(!resume.profile.fullname || !resume.profile.email){
        return false
      }
      return true
  } 

    const handleDelete = async (resumeId: string) => {
      const response = await ResumeService.delete(resumeId);
      if (!response.ok) {
        toast.showToast('Error deleting resume', 'error', 3000);
        return;
      }
      toast.showToast(`Resume deleted successfully`, 'success', 3000);
      return (window.location.href = '/builder');
    };
    return (
      <section className=" min-h-[80vh] sm:h-full w-full ">
        <div className="w-full h-full grid place-items-center gap-4  ">
          {resumes?.length ? (
            <>
              <div className="w-full flex items-center justify-between   px-4">
                <h3 className="w-full text-left font-medium text-3xl">
                  All Resumes <span className="font-bold text-[12px]">{resumes.length} in total</span>
                </h3>
              </div>
              <div className=" w-full h-fit grid grid-cols-2 md:grid-cols-3 gap-4 px-4">
                {resumes.map((resume, index) => (
                  <div
                    key={index}
                    tabIndex={0} /* allows focus on tap for mobile */
                    className="min-h-[300px] max-w-[250px] overflow-hidden grid place-items-center rounded-2xl shadow-[0_0_4px_0_gray] select-none relative group hover:shadow-[1px_2px_2px_1px_skyblue] focus-within:shadow-[1px_2px_2px_1px_skyblue] cursor-pointer"
                  >
                    <div className="w-full h-full select-none absolute -z-10 transition-all duration-300 group-hover:blur-[1.5px] group-hover:scale-[1.1] group-focus-within:scale-[1.1]  group-focus-within:blur-[1.5px]">
                      <ResumePreview resumeId={resume.id} template={resume.template} />
                    </div>
                    <div className="flex gap-2 relative -bottom-[100%] transition-all ease-in-out duration-900 group-hover:bottom-0 group-focus-within:bottom-0">
                    {hasMinimumData(resume) ?  <Button
                        onClick={() => (window.location.href = `/builder/${resume?.id}/preview`)}
                        variant="primary"
                        size="small"
                      >
                        Preview
                      </Button>: 
                       <Button
                        onClick={() => handleDelete(resume.id)}
                        variant="danger"
                        size="small"
                      >
                        Delete
                      </Button>}
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
           loadingResume ? (
              <div className="w-full grid place-items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2  text-center flex items-center justify-center gap-2 ">
                  Lets get started <Rocket className="animate-pulse" />
                </h1>
                <p className="text-gray-600">Create a new resume or work with existing ones</p>
              </div>
            )
          )}

          <div className="flex  gap-3 w-full items-center justify-center sticky bottom-0 bg-white p-2 md:relative">
            <Button variant="primary" size="medium" onClick={handleCreateResume} disabled={creating?true:false} className={`${creating?"animate-pulse":""}`} >
              {creating?"Creating Resume....":<><Plus /> Add New</>}
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

  if (!user && !loading && !loadingResume) {
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
