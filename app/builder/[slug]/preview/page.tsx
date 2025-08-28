'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ResumeData } from '@/types/types';
import { ResumeStorage } from '@/lib/resume-storage';
import ResumePreview from '@/components/Templates/ResumePreview';

const PreviewPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  const [loading, setLoading] = useState(true);
  console.log(slug);
  useEffect(() => {
    if (!slug) return;

    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      const fetchResume = async () => {
        const stored = await ResumeStorage.load(slug);
        if (stored) {
          setResumeData(stored.data);
        } else {
          console.warn('No resume data found for UUID:', slug);
          window.location.href = '/builder';
          return;
        }
      };
      fetchResume();
    } catch (error) {
      console.error('Error loading resume data:', error);
      window.location.href = '/builder';
      return;
    }

    setLoading(false);
  }, [slug]);

  let resumeTemplate;

  const handleDownloadPDF = async () => {
    if (!resumeData) return;
    resumeTemplate = await ResumeStorage.load(slug);
    try {
      console.log('🔄 Starting PDF download...');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeData,
          template: resumeTemplate
        })
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('📄 Content type:', contentType);

        if (contentType?.includes('application/pdf')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${resumeData.profile.fullname || 'Resume'}_${resumeTemplate}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log('✅ PDF downloaded successfully');
        } else {
          throw new Error('Invalid response type: ' + contentType);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ PDF generation error:', errorData);
        alert(`Error: ${errorData.details || errorData.error || 'PDF generation failed'}`);
      }
    } catch (error) {
      console.error('❌ PDF download error:', error);
      alert('Error generating PDF. Please try again.');
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading preview...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!resumeData) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>No Resume Data</h2>
          <p className='text-gray-600 mb-6'>Please complete your resume before previewing.</p>
          <button onClick={() => (window.location.href = '/builder')} className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  // Incomplete data state
  const hasMinimumData = resumeData.profile.fullname && resumeData.profile.email;
  if (!hasMinimumData) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>Incomplete Resume</h2>
          <p className='text-gray-600 mb-6'>Please complete at least your name and email before previewing.</p>
          <button onClick={() => (window.location.href = `/builder/${slug}`)} className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
            Continue Editing
          </button>
        </div>
      </div>
    );
  }

  // Main preview page
  return (
    <div className='min-h-screen  py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-4'>
        <div className='flex justify-center gap-4 flex-wrap'>
          <button onClick={handleDownloadPDF} className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md'>
            📄 Download PDF
          </button>
          {/* <Button
                      onClick={async () => {
                          try {
                              const response = await fetch('/api/test-pdf');
                              if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = 'test.pdf';
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                              } else {
                                  alert('Test PDF generation failed');
                              }
                          } catch (error) {
                              console.error('Test error:', error);
                              alert('Test failed');
                          }
                      } }
                      className='px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium shadow-md' children={undefined} variant={'primary'} size={'small'}          >
            🧪 Test PDF
          </Button> */}
          <button onClick={() => (window.location.href = `/builder/${slug}`)} className='px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md'>
            ✏️ Edit Resume
          </button>
          <button onClick={() => (window.location.href = '/builder')} className='px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md'>
            ➕ New Resume
          </button>
        </div>
        {/* Page Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Resume Preview</h1>
          <p className='text-gray-600'>Choose a template and preview your resume</p>
        </div>
        <ResumePreview slug={slug} resumeData={resumeData} />
      </div>
    </div>
  );
};

export default PreviewPage;
