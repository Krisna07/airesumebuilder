'use client';
import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import { useAuth } from '@/context/authContext';
import { uploadResume } from '@/services/resumeServices';
import React from 'react'

const isPdfFile = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

type PickerInput = HTMLInputElement & { showPicker?: () => void }

const Page = () => {
  const { user, getSubscription } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const resetFileInput = () => {
    const input = fileInputRef.current;
    if (input) {
      input.value = '';
    }
  };

  const canPickFile = !loading;

  const openFilePicker = () => {
    if (!canPickFile) return;

    const input = fileInputRef.current as PickerInput | null;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    // console.log(file)

    if (!isPdfFile(file)) {
      setError('Unsupported file type. Please upload a PDF.');
      showToast('Please upload a PDF file', 'error');
      setLoading(false);
      resetFileInput();
      return;
    }

    setFileName(file.name);
    // console.log(file.name)
    try {

      const response = await uploadResume(file, user?.id);
      console.log(response);
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data?.error || data?.details || 'Failed to process resume';
        showToast(errorMessage, 'error');
        setError(errorMessage);
        setFileName(null);
        resetFileInput();
        return;
      }
      showToast('Resume uploaded successfully!', 'success');
      setSuccess(true);
      if (user?.id) {
        await getSubscription(false);
      }
      // Start a 2-second interval when upload is successful
      const redirect = setInterval(() => {
        return (window.location.href = `/builder/resumes/${data.data.id}`);
        clearInterval(redirect);
      }, 2000);
      return redirect;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showToast(errorMessage, 'error');
      setSuccess(false);
      return resetFileInput();
    } finally {
      return setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div className='w-full h-[80vh] grid place-items-center'>
      <div className="w-fit">
        <input
          ref={fileInputRef}
          type="file"
          id="resume-upload"
          className="sr-only"
          onChange={e => handleFileChange(e.target.files?.[0] || null)}
          accept="application/pdf,.pdf"
          aria-label="Upload resume PDF"
          disabled={!canPickFile}
        />
        <div
          role="button"
          tabIndex={canPickFile ? 0 : -1}
          aria-label="Upload resume PDF"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFilePicker}
          onKeyDown={handleKeyDown}
          className={`flex flex-col items-center justify-center w-full p-6 rounded-xl transition-all shadow-2xl ${loading ? 'scale-[1.1]' : ''} ${error ? 'border-red-400' : 'dark:bg-gray-700'} ${canPickFile ? 'cursor-pointer hover:scale-[1.05]' : 'cursor-not-allowed opacity-80'}
            }`}
        >
        {loading ? (
            <div className="flex flex-col items-center ">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border"></div>
            <p className="mt-2">Analyzing your resume...</p>
          </div>
        ) : error ? (
              <div className="relative z-20 flex flex-col items-center text-red-600">
            <XCircle className="w-10 h-10" />
            <p className="mt-2 font-semibold">Error</p>
            <p className="text-sm text-center">Error has occured please try again. </p>
            <button
                  type="button"
                  className="mt-2 px-4 py-1  text-red-700 rounded hover:bg-red-200"
              onClick={e => {
                e.stopPropagation();
                setError(null);
                setFileName(null);
                setSuccess(false);
                resetFileInput();
              }}
            >
              Try Again
            </button>
          </div>
        ) : success && fileName ? (
                <div className="flex flex-col items-center text-green-600 pointer-events-none">
            <CheckCircle2 className="w-10 h-10" />
            <p className="mt-2 font-semibold">Successfully Uploaded</p>
            <p className="text-sm">{fileName}</p>
          </div>
        ) : (
                  <div className="flex flex-col items-center text-center pointer-events-none">
            <UploadCloud className="w-10 h-10 mb-2" />
            <p className="font-semibold">Click to upload or drag and drop</p>
            <p className="text-sm">PDF only. The content will be extracted by AI.</p>
          </div>
        )}
      </div>
      </div></div>
  );
}


export default Page