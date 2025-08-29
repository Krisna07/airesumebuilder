'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ResumeData, UserResume } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { Download, Edit, Plus } from 'lucide-react';

const PreviewPage = () => {
  const params = useParams();
  const { user } = useAuth();
  const slug = params.slug as string;
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<UserResume['template']>('modern');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;

    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      const fetchResume = async () => {
        const stored = await ResumeService.getSingle(slug);
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
    resumeTemplate = await ResumeService.getSingle(slug);
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

  const templates: { id: UserResume['template']; name: string; description: string; icon: string }[] = [
    { id: 'modern', name: 'Modern', description: 'Clean design with gradient header', icon: '🎨' },
    { id: 'classic', name: 'Classic', description: 'Traditional professional layout', icon: '📄' },
    { id: 'minimal', name: 'Minimal', description: 'Simple, elegant design', icon: '✨' }
  ];

  const handleTemplateChange = async (templateId: UserResume['template']) => {
    if (!resumeData) return;
    setSelectedTemplate(templateId);
    if (typeof window !== 'undefined' && user) {
      await ResumeService.save(user.id, slug, templateId, resumeData);
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
        <div className='flex justify-center gap-4 flex-wrap text-[14px]'>
          <button onClick={handleDownloadPDF} className='px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2'>
            <Download size={16} /> Download
          </button>

          <button
            onClick={() => (window.location.href = `/builder/${slug}`)}
            className='px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center gap-2'
          >
            <Edit size={16} /> Edit Resume
          </button>
          <button
            onClick={() => (window.location.href = '/builder')}
            className='px-4 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium shadow-md flex items-center gap-2'
          >
            <Plus size={16} /> New Resume
          </button>
        </div>
        <div className='w-full grid grid-cols-3 gap-4'>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedTemplate === template.id ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
            >
              <div className='flex items-center gap-3 justify-center'>
                <span className='text-2xl '>{template.icon}</span>
                <h3 className={`font-semibold ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}>{template.name}</h3>
              </div>
              <p className='text-sm text-gray-600 max-[600]:block hidden'>{template.description}</p>
            </button>
          ))}
        </div>
        <ResumePreview resumeData={resumeData} template={selectedTemplate} />
      </div>
    </div>
  );
};

export default PreviewPage;
