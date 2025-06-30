'use client';
import { useRef, useState } from 'react';
import { useResume } from '@/context/ResumeContext';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';

// Set up the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function ResumeUpload() {
  const fileInput = useRef<HTMLInputElement>(null);
  const { setResume } = useResume();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error("Failed to read file."));
        }
        try {
          const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            }).join(' ') + '\n';
          }
          resolve(text);
        } catch (error) {
          console.error('Error parsing PDF:', error);
          reject(new Error('Could not parse the PDF file.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (file.type !== 'application/pdf') {
      setError('Unsupported file type. Please upload a PDF.');
      setLoading(false);
      return;
    }

    try {
      const text = await extractTextFromPdf(file);
      
      const res = await fetch('/api/ai/extract-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to extract resume data.');
      }

      const data = await res.json();
      setResume((prev) => ({ ...prev, ...data.data }));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
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
            <p className="text-sm text-center">{error}</p>
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
