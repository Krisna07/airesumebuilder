'use client';
import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';

export default function ResumeUpload() {
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const resetFileInput = () => {
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (file.type !== 'application/pdf') {
      setError('Unsupported file type. Please upload a PDF.');
      showToast('Please upload a PDF file', 'error');
      setLoading(false);
      resetFileInput();
      return;
    }

    if (!user) {
      window.location.href = '/builder';
      return;
    }
    setFileName(file.name);

    try {
      const response = await ResumeService.uploadResume(file, user.id);
      const data = await response.json();
      if (!response.ok) {
        showToast('Failed to process resume', 'error');
        setError('Error has occured');
        setFileName(null);
        resetFileInput();
        return;
      }
      showToast('Resume uploaded successfully!', 'success');
      setSuccess(true);
      // Start a 2-second interval when upload is successful
      const redirect = setInterval(() => {
        return (window.location.href = `/builder/${data.data.id}`);
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

  const triggerFileSelect = () => {
    fileInput.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        id="resume-upload"
        ref={fileInput}
        className="hidden"
        onChange={e => handleFileChange(e.target.files?.[0] || null)}
        accept=".pdf"
      />
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2">Analyzing your resume...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-red-600">
            <XCircle className="w-10 h-10" />
            <p className="mt-2 font-semibold">Error</p>
            <p className="text-sm text-center">Error has occured please try again. </p>
            <button
              className="mt-2 px-4 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <div className="flex flex-col items-center text-green-600">
            <CheckCircle2 className="w-10 h-10" />
            <p className="mt-2 font-semibold">Successfully Uploaded</p>
            <p className="text-sm">{fileName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center text-gray-500">
            <UploadCloud className="w-10 h-10 mb-2" />
            <p className="font-semibold">Click to upload or drag and drop</p>
            <p className="text-sm">PDF only. The content will be extracted by AI.</p>
          </div>
        )}
      </div>
    </div>
  );
}
