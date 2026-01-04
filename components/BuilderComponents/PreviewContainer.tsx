import { useToast } from "@/context/PopupContext";
import { ResumeService } from "@/services/resumeServices";
import { ResumeData } from "@/types/types";
import React, { useState } from "react";
import Button from "../UI/Button";
import ResumePreview from "../Templates/ResumePreview";
import { Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "../UI/ConfirmDialog";


interface PreviewContainerProps {
  resume: ResumeData;
  index: number;
  toast: ReturnType<typeof useToast>;
  onDeleted: (id: string) => void;
}

export const PreviewContainer: React.FC<PreviewContainerProps> = ({ resume, toast, onDeleted }) => {
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

        className={` group relative min-h-[300px] w-full  overflow-hidden rounded-2xl border border-transparent p-2 shadow-[0_0_4px_0_gray] select-none transition-all duration-300 focus-within:shadow-[0_4px_12px_-1px_rgba(56,189,248,0.4)] hover:shadow-[0_4px_12px_-1px_rgba(56,189,248,0.4)] ${isGone ? 'opacity-0 scale-90 pointer-events-none' : 'anim-fade-scale'}`}
      >
        <div
          className={`absolute inset-0 z-10 transition-all duration-500 group-hover:blur-[1.5px] group-hover:scale-[1.05] group-focus-within:scale-[1.05] group-focus-within:blur-[1.5px] ${isDeleting ? 'grayscale blur-sm opacity-70' : ''}`}
        >

        </div>
        <div className="-z-10 group-hover:blur-[1.5px] group-hover:scale-[1.05] group-focus-within:scale-[1.05] group-focus-within:blur-[1.5px] transition-all">
          <ResumePreview template={resume.template} resumeData={resume} />
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex translate-y-full gap-2 p-3 transition-all duration-500 ease-out group-hover:translate-y-0  group-focus-within:translate-y-0 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
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