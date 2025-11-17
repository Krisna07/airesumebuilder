'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ResumeData } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { Bot, Download, Edit, Plus, Trash, Loader2 } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import Button from '@/components/UI/Button';
import ConfirmDialog from '@/components/UI/ConfirmDialog';
import { ScrapeResult } from '@/components/Forms/JobDescription';
import Templates from '@/components/Templates/templates';

const sanitizeFile = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w.\-]+/g, '');

const PreviewPage = () => {
  const params = useParams();
 const slug = (params?.slug ?? "") as string;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [status, setStatus] = useState<'loading' | 'ready' | 'incomplete' | 'not-found' | 'error'>('loading');
  const [showFallback, setShowFallback] = useState(false); // delay gate for not-found
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [jobDescription, setJobDescription] = useState<ScrapeResult>();
  const [downlaoding, setDownloading] = useState<boolean>(false)
  const [generating, setRegenerating] = useState<boolean>(false)
  const [pendingUpdate, setPendingUpdate] = useState(false); // keep stale resume during async ops

  useEffect(() => {
    let active = true;
    if (!slug) return;

    const fetchResume = async () => {
      if (!active) return;

      // If auth still resolving, keep loading skeleton regardless of slug
      if (authLoading) {
        setStatus('loading');
        return;
      }

      // Guest path (user null after auth resolved -> guest or signed out)
      if (!user) {
        const localResume = typeof window !== 'undefined' ? localStorage.getItem(slug) : null;
        if (localResume) {
          try {
            const parsed = JSON.parse(localResume);
            setResumeData(parsed);
            const hasMinimum = !!(parsed?.profile?.fullname && parsed?.profile?.email);
            setStatus(hasMinimum ? 'ready' : 'incomplete');
          } catch {
            setStatus('not-found');
          }
        } else {
          setStatus('not-found');
        }
        return;
      }

      // Authenticated path
      try {
        const [resumeResp, descriptionResp] = await Promise.all([
          ResumeService.getSingle(slug),
          fetch(`/api/resume/description?slug=${encodeURIComponent(slug)}`),
        ]);

        if (descriptionResp.ok) {
          const descriptionData = await descriptionResp.json().catch(() => null);
          if (active && descriptionData) {
            setJobDescription(descriptionData?.data ?? descriptionData);
          }
        }

        if (!active) return;
        const resumeJson = await resumeResp.json().catch(() => ({}));

        if (!resumeResp.ok || !resumeJson?.data) {
          // Important: Only mark not-found AFTER auth loading false AND we have confirmed user exists
          setStatus('not-found');
          showToast('No resume data found', 'warning', 2500);
          return;
        }

        setResumeData(resumeJson.data);
        setSelectedTemplate(resumeJson.data.template);
        const hasMinimum = !!(resumeJson.data.profile?.fullname && resumeJson.data.profile?.email);
        setStatus(hasMinimum ? 'ready' : 'incomplete');
      } catch (err) {
        if (active) {
          console.error('Error loading resume data:', err);
          showToast('Error loading resume. Redirecting…', 'error', 2500);
          setStatus('error');
          setTimeout(() => (window.location.href = '/builder'), 600);
        }
      }
    };

    fetchResume();

    return () => {
      active = false;
    };
  }, [slug, user, authLoading, showToast]);

  useEffect(() => {
    if (status === 'not-found') {
      const timer = setTimeout(() => setShowFallback(true), 250); // slight delay to suppress flash
      return () => clearTimeout(timer);
    } else if (showFallback) {
      setShowFallback(false);
    }
  }, [status, showFallback]);

  const handleTemplateChange = async (templateId: string) => {
    if (!resumeData) return;
    setPendingUpdate(true);
    setSelectedTemplate(templateId);
    if (typeof window !== 'undefined' && user) {
      try {
        await ResumeService.save(user.id, slug, templateId, resumeData);
        showToast('Template updated', 'success', 1500);
      } catch {
        showToast('Failed to save template', 'error', 2000);
      } finally {
        setPendingUpdate(false);
      }
    } else {
      setPendingUpdate(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) return;
    if (!user) {
      showToast('Please login to use this feature', 'warning', 3000);
      return;
    }
    setDownloading(true)
    setRegenerating(true);
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
        showToast(errorData?.details || errorData?.error || 'PDF generation failed', 'error', 3000);
        setDownloading(false);
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
      showToast('PDF downloaded', 'success', 1500);
      setDownloading(false);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showToast('Error generating PDF. Please try again.', 'error', 3000);
    }
  };

  const performDelete = async () => {
    if (!resumeData) return;
    setDeleting(true);
    if (!user) {
      await localStorage.removeItem(slug);
      setDeleting(false);
      return showToast('Resume deleted', 'success', 2200);
    }

    const response = await ResumeService.delete(resumeData.id);
    if (!response.ok) {
      showToast('Error deleting resume', 'error', 3000);
      setDeleting(false);
      return;
    }
    showToast('Resume deleted', 'success', 2200);
    setFadeOut(true);
    setTimeout(() => {
      window.location.href = '/builder';
    }, 320);
  };

  const handleRegerate = async (resumeData: ResumeData) => {
    if (!user) {
      return showToast('This feature is not availbale on guest version', 'info', 3000);
    }
    setRegenerating(true);
    setPendingUpdate(true);
    const response = await ResumeService.regenerate(resumeData, jobDescription);
    const data = await response.json();
    if (!response.ok) {
      showToast('Error regenerating resume', 'error', 3000);
      setRegenerating(false);
      setPendingUpdate(false);
      return;
    }
    const updatedResume = await ResumeService.save(
      resumeData.userId,
      resumeData.id,
      resumeData.template,
      data.resume,
    );

    if (!updatedResume.ok) {
      setRegenerating(false);
      setPendingUpdate(false);
      return showToast(
        'Error saving the resume, the data isnot saved to database',
        'warning',
        4000,
      );
    }
    setResumeData({
      id: resumeData.id,
      userId: resumeData.userId,
      title: resumeData.title,
      template: resumeData.template,
      profile: data.resume.profile,
      skills: data.resume.skills,
      experiences: data.resume.experiences,
      educations: data.resume.educations,
      customSections: data.resume.customSections,
    });

    showToast(`Resume has been regenerated Successfully`, 'success', 3000);
    setRegenerating(false);
    setPendingUpdate(false);
    return;
  };
  // Unified rendering logic to prevent 'No Resume Data' flash
  if (status === 'loading') {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid gap-8">
          <div className="h-10 w-64 rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
              />
            ))}
          </div>
          <div className="h-[70vh] w-full rounded-2xl border border-dashed border-gray-300 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_12px,#eee_12px,#eee_24px)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'incomplete' && resumeData) {
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

  if (status === 'ready' && resumeData) {
    const displayTemplate = user ? Templates : Templates.slice(0, 3);
    // Main preview page
    return (
      <div
        className={`min-h-screen py-8 relative transition-all duration-300 ${fadeOut ? 'opacity-0 scale-[0.985]' : ''}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
          {/* Actions */}
          <div className="flex justify-center gap-1 gap-y-2 md:gap-3 flex-wrap text-[14px]">
            <button
              onClick={handleDownloadPDF}
              disabled={deleting || downlaoding || generating}
              className={`px-4 py-1 bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${deleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
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
              disabled={user ? false : true}
              className="px-4 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> New Resume
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              className={`px-4 py-1 bg-red-200 text-gray-800 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${deleting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-400'}`}
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}{' '}
              {deleting ? 'Deleting' : 'Delete'}
            </button>
            <button
              onClick={() => handleRegerate(resumeData)}
              className={`px-4 py-1 bg-green-200 text-gray-800 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${generating ? 'animate-pulse' : 'hover:bg-green-400'} ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={generating || downlaoding || deleting}
            >
              <Bot size={16} /> {generating ? 'Generating...' : 'Re-Generate'}
            </button>
          </div>

          <div className="space-y-2">
            {' '}
            <div className="w-full grid grid-cols-3 gap-4 ">
              {displayTemplate.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`md:p-3 px-1 rounded-lg border-2 transition-all duration-200 text-left ${selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                >
                  <div className="flex items-center gap-3 justify-left">
                    {/* <span className="text-2xl">{template.}</span> */}
                    <h3
                      className={`text-[14px]  ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}
                    >
                      {template.name}
                    </h3>
                  </div>
                  {/* <p className="text-sm text-gray-600 mt-1 hidden sm:block">{}</p> */}
                </button>
              ))}
            </div>
            {!user && (
              <div className="w-full flex flex-col gap-2 items-center justify-center">
                <p>
                  Please{' '}
                  <a href="/auth/signin" className="text-blue-600 underline">
                    sign in
                  </a>{' '}
                  to access more templates
                </p>
              </div>
            )}
          </div>
          <div
            className="relative w-full min-h-fit overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm"
            id="resumeViewport"
          >
            {/* Optional inner wrapper to constrain width / center */}
            <div className="mx-auto max-w-[900px]">
              <ResumePreview
                resumeData={resumeData}
                template={selectedTemplate}
                regenerating={generating}
              /* Let container control height & scrolling */
              />
            </div>
            {pendingUpdate && (
              <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] grid place-items-center">
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-medium">Updating…</span>
                </div>
              </div>
            )}
            {deleting && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 text-sky-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm font-medium">Deleting…</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <ConfirmDialog
          open={showConfirm}
          onCancel={() => (!deleting ? setShowConfirm(false) : null)}
          onConfirm={performDelete}
          loading={deleting}
          title="Delete Resume?"
          message={
            <span>
              Are you sure you want to delete this resume?
              <br />
              This action cannot be undone.
            </span>
          }
          confirmText="Delete"
        />
      </div>
    );
  }
  // No data fallback only when status is not-found
  if (status === 'not-found' && showFallback) {
    console.log('not-found fallback displayed');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Resume Data</h2>
          <p className="text-gray-600 mb-6">Please complete your resume before previewing or create a new one.</p>
          <button
            onClick={() => (window.location.href = '/builder')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Builder
          </button>
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Resume</h2>
          <p className="text-gray-600 mb-6">An unexpected error occurred. Redirecting…</p>
        </div>
      </div>
    );
  }
  // Should not reach here; keep skeleton as fallback
  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid gap-8">
        <div className="h-10 w-64 rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-[70vh] w-full rounded-2xl border border-dashed border-gray-300 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_12px,#eee_12px,#eee_24px)] animate-pulse" />
      </div>
    </div>
  );

};

export default PreviewPage;
