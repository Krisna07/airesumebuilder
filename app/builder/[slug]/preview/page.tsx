'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ResumeData, UserResume } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { Download, Edit, Plus } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import Button from '@/components/UI/Button';

const templates: {
  id: UserResume['template'];
  name: string;
  description: string;
  icon: string;
}[] = [
  { id: 'modern', name: 'Modern', description: 'Clean design with gradient header', icon: '🎨' },
  { id: 'classic', name: 'Classic', description: 'Traditional professional layout', icon: '📄' },
  { id: 'minimal', name: 'Minimal', description: 'Simple, elegant design', icon: '✨' },
];

const sanitizeFile = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w.\-]+/g, '');

const PreviewPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const toast = useToast();

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<UserResume['template']>('modern');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!slug || typeof window === 'undefined') return;

    (async () => {
      try {
        const response = await ResumeService.getSingle(slug);
        const data = await response.json();

        if (!active) return;

        if (!response.ok || !data?.data) {
          toast.showToast(`No resume data found, redirecting…`, 'warning', 2500);
          setLoading(false);
          setTimeout(() => (window.location.href = '/builder'), 600);
          return;
        }

        setResumeData(data.data);
        // If you store template with the resume, you could set it here.
        // setSelectedTemplate(data.data.template ?? 'modern');
      } catch (err) {
        console.error('Error loading resume data:', err);
        toast.showToast('Error loading resume. Redirecting…', 'error', 2500);
        setTimeout(() => (window.location.href = '/builder'), 600);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, toast]);

  const handleTemplateChange = async (templateId: UserResume['template']) => {
    if (!resumeData) return;
    setSelectedTemplate(templateId);
    if (typeof window !== 'undefined' && user) {
      try {
        await ResumeService.save(user.id, slug, templateId, resumeData);
        toast.showToast('Template updated', 'success', 1500);
      } catch {
        toast.showToast('Failed to save template', 'error', 2000);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) return;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          template: selectedTemplate, // FIX: pass the actual template id/string
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ PDF generation error:', errorData);
        toast.showToast(
          errorData?.details || errorData?.error || 'PDF generation failed',
          'error',
          3000,
        );
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error(`Invalid response type: ${contentType}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = sanitizeFile(resumeData.profile.fullname || 'Resume');
      a.href = url;
      a.download = `${name}_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.showToast('PDF downloaded', 'success', 1500);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      toast.showToast('Error generating PDF. Please try again.', 'error', 3000);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // No data
  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Resume Data</h2>
          <p className="text-gray-600 mb-6">Please complete your resume before previewing.</p>
          <button
            onClick={() => (window.location.href = '/builder')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  // Minimum data check
  const hasMinimumData = !!(resumeData.profile.fullname && resumeData.profile.email);
  if (!hasMinimumData) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center p-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Incomplete Resume</h2>
          <p className="text-gray-600 mb-6">
            Please complete at least your name and email before previewing.
          </p>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => (window.location.href = `/builder/${slug}`)}
          >
            Continue Editing
          </Button>
        </div>
      </div>
    );
  }

  // Main preview page
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
        {/* Actions */}
        <div className="flex justify-center gap-3 flex-wrap text-[14px]">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
          >
            <Download size={16} /> Download
          </button>

          <button
            onClick={() => (window.location.href = `/builder/${slug}`)}
            className="px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center gap-2"
          >
            <Edit size={16} /> Edit Resume
          </button>

          <button
            onClick={() => (window.location.href = '/builder')}
            className="px-4 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={16} /> New Resume
          </button>
        </div>

        {/* Template picker */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleTemplateChange(t.id)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedTemplate === t.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex items-center gap-3 justify-center">
                <span className="text-2xl">{t.icon}</span>
                <h3
                  className={`font-semibold ${selectedTemplate === t.id ? 'text-blue-700' : 'text-gray-800'}`}
                >
                  {t.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        <ResumePreview resumeData={resumeData} template={selectedTemplate} height="82vh" />
      </div>
    </div>
  );
};

export default PreviewPage;
