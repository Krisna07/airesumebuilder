import React, { useState } from 'react';
import Button from '../UI/Button';
import { ResumeService } from '@/services/resumeServices';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { File, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/context/PopupContext';

const LoggedInUser = (userId:string) => {
  const [creating, setCreating] = useState(false);
  const route = useRouter();
    const toast = useToast();
  

  const handleCreateResume = async () => {
    setCreating(true);
    const response = await ResumeService.create(userId);
    const data = await response.json();
    if (!response.ok) {
      toast.showToast(response.statusText, 'error', 3000);
      return setCreating(false);
    }
    route.push(`/builder/${data.data.id}`);
    toast.showToast('Resume created successfully', 'success', 3000);
    setCreating(false);
  };

  return (
    <div className='w-full  grid place-items-center place-self-end md:place-self-start sticky bottom-0 p-4 gap-2 '>
      <div className='flex gap-2 items-center'>
        <Button variant='primary' size='medium' onClick={handleCreateResume} disabled={creating} className={`${creating ? 'animate-pulse' : ''}`}>
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
  );
};

export default LoggedInUser;
