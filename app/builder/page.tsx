'use client';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { File, Plus, Rocket, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';
import ResumePreview from '@/components/Templates/ResumePreview';
import ConfirmDialog from '@/components/UI/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { ResumeData } from '@/types/types';
import GuestUser from '@/components/BuilderComponents/GuestUser';

interface PreviewContainerProps {
  resume: ResumeData;
  index: number;
  toast: ReturnType<typeof useToast>;
  onDeleted: (id: string) => void;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ resume, toast, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGone, setIsGone] = useState(false);

  const hasMinimumData = (r: ResumeData) => !!(r.profile.fullname && r.profile.email);

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await ResumeService.delete(resume.id);
      if (!response.ok) {
        toast.showToast('Error deleting resume', 'error', 3000);
        setIsDeleting(false);
        return;
      }
      toast.showToast('Resume deleted', 'success', 2500);
      // animate out then notify parent
      setIsGone(true);
      setTimeout(() => onDeleted(resume.id), 350);
    } catch (error) {
      console.error('Delete error:', error);
      toast.showToast('Error deleting resume', 'error', 3000);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        tabIndex={0}
        key={resume.id} // Use resume.id instead of index for better React key
        className={`group relative min-h-[300px] w-full max-w-[250px] overflow-hidden rounded-2xl border border-transparent p-2 shadow-[0_0_4px_0_gray] select-none transition-all duration-300 focus-within:shadow-[0_4px_12px_-1px_rgba(56,189,248,0.4)] hover:shadow-[0_4px_12px_-1px_rgba(56,189,248,0.4)] ${isGone ? 'opacity-0 scale-90 pointer-events-none' : 'anim-fade-scale'}`}
      >
        {typeof resume.matchingScore === 'number' && (
          <div className='absolute top-2 left-2 z-10 rounded-full bg-white/90 backdrop-blur px-2 py-1 text-[11px] font-medium shadow border border-sky-200 flex items-center gap-1'>
            <span className='inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse' />
            {Math.round(resume.matchingScore)}%
          </div>
        )}
        <div
          className={`absolute inset-0 -z-10 transition-all duration-500 group-hover:blur-[1.5px] group-hover:scale-[1.05] group-focus-within:scale-[1.05] group-focus-within:blur-[1.5px] ${isDeleting ? 'grayscale blur-sm opacity-70' : ''}`}
        >
          <ResumePreview template={resume.template} resumeData={resume} />
        </div>
        <div
          className={`absolute inset-x-0 bottom-0 flex translate-y-full gap-2 p-3 transition-all duration-500 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {hasMinimumData(resume) && (
            <Button
              onClick={() => (window.location.href = `/builder/${resume.id}/preview`)}
              variant='primary'
              size='small'
              className='flex-1'
            >
              Preview
            </Button>
          )}
          <Button
            onClick={() => (window.location.href = `/builder/${resume.id}`)}
            variant='secondary'
            size='small'
            className='flex-1'
          >
            Edit
          </Button>
          {!hasMinimumData(resume) && (
            <Button
              onClick={() => setShowConfirm(true)}
              variant='danger'
              size='small'
              className='flex items-center gap-1'
            >
              {isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
              Del
            </Button>
          )}
        </div>
        {isDeleting && (
          <div className='absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm'>
            <Loader2 className='h-7 w-7 animate-spin text-sky-500' />
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => (!isDeleting ? setShowConfirm(false) : null)}
        onConfirm={performDelete}
        loading={isDeleting}
        title='Delete Resume?'
        message={
          <span>
            Delete this incomplete resume? <br />
            This action cannot be undone.
          </span>
        }
        confirmText='Delete'
      />
    </>
  );
};

const Page = () => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [resumes, setResumes] = useState<ResumeData[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);
  const router = useRouter(); // Fixed: was 'route', should be 'router'

  useEffect(() => {
    if (!(loading || (user && !initialFetched))) return;
    const interval = setInterval(() => {}, 55);
    return () => clearInterval(interval);
  }, [loading, initialFetched, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchResumes = async () => {
      try {
        const response = await ResumeService.getAll(user.id);
        const data = await response.json();
        if (!response.ok) {
          if (active) {
            toast.showToast(response.statusText || 'Failed to load resumes', 'error', 3500);
            setResumes([]);
          }
          return;
        }
        if (active) setResumes(data.data || []);
      } catch (error) {
        console.error('Error fetching resumes:', error);
        if (active) {
          toast.showToast('Network error loading resumes', 'error', 3500);
          setResumes([]);
        }
      } finally {
        if (active) setInitialFetched(true);
      }
    };

    fetchResumes();

    return () => {
      active = false;
    };
  }, [user, toast]); // Added toast to dependencies

  // Only show loading when we are still resolving auth or fetching resumes for a logged-in user.
  const isInitialLoading = (loading && user !== null) || (user && !initialFetched);

  // If auth finished and there's no user, consider loading done to avoid blank page
  useEffect(() => {
    if (!loading && !user && !initialFetched) {
      setInitialFetched(true);
    }
  }, [loading, user, initialFetched]);

  if (isInitialLoading) {
    return (
      <section className='w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 px-4'>
        <div className='flex flex-col items-center gap-3'>
          <div className='relative'>
            <div className='absolute inset-0 animate-ping rounded-xl bg-sky-200/30' />
          </div>
          <h2 className='text-xl font-semibold text-gray-800 tracking-tight'>
            Loading your resumes
          </h2>
          <p className='text-gray-500 text-sm'>Please wait...</p>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full max-w-5xl'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='relative h-[300px] max-w-[250px] w-full overflow-hidden rounded-2xl shadow-inner bg-gray-100 skeleton-shimmer' />
          ))}
        </div>
      </section>
    );
  }

  if (user) {
    const handleCreateResume = async () => {
      setCreating(true);
      try {
        const response = await ResumeService.create(user.id);
        const data = await response.json();
        if (!response.ok) {
          toast.showToast(response.statusText, 'error', 3000);
          return;
        }
        router.push(`/builder/${data.data.id}`); // Fixed: using router instead of route
        toast.showToast('Resume created successfully', 'success', 3000);
      } catch (error) {
        console.error('Error creating resume:', error);
        toast.showToast('Error creating resume', 'error', 3000);
      } finally {
        setCreating(false);
      }
    };

    const handleResumeDeleted = (id: string) => {
      setResumes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    };

    return (
      <section className='md:min-h-[80vh] h-full w-full min-[1000px]:w-[1000px] grid place-items-center'>
        <div className={`w-full ${resumes && resumes.length ? 'place-self-start' : 'md:place-self-end'} grid gap-4 transition-opacity duration-300 anim-fade-in-soft`}>
          {resumes && resumes.length ? (
            <>
              <div className='w-full flex items-center justify-between px-4'>
                <h3 className='w-full text-left font-medium text-3xl'>
                  All Resumes <span className='font-bold text-[12px]'>{resumes.length} in total</span>
                </h3>
              </div>
              <div className='w-full h-fit grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4'>
                {resumes.map((resume, index) => (
                  <PreviewContainer
                    resume={resume}
                    toast={toast}
                    index={index}
                    key={resume.id}
                    onDeleted={handleResumeDeleted}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {!initialFetched ? (
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

        <div className='w-full grid place-items-center place-self-end md:place-self-start sticky bottom-0 p-4 gap-2'>
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
