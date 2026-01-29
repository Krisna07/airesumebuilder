/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResumeData } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { analyzeResume, ResumeService } from '@/services/resumeServices';
import { Bot, Download, Edit, Trash, Loader2, FileText, LayoutTemplate, BarChart2, ChevronLeft, X, Settings } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import Button from '@/components/Ui/Button';
import ConfirmDialog from '@/components/Ui/ConfirmDialog';
import Templates from '@/components/Templates/templates';
import ReportsPanel from './ReportsPanel';
import TemplatesPanel from './TemplatesPanel';
import { useJobDescriptions } from '@/hooks/useJobDescriptions';
import { useGetResume } from '@/hooks/useResume';
import { ResumeCache } from '@/lib/resumeCache';
import { AnimatedTabs } from '@/components/Ui/AnimatedTabs';
import JobDescription from '@/components/Forms/JobDescription';
import { JobDescriptionService } from '@/services/jdServices';
import MenuPanel from './MenuPanel'; // Assuming this component exists

const sanitizeFile = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '');

const PreviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug ?? "") as string;
  const { user, getSubscription } = useAuth();
  const { showToast } = useToast();

  // --- State ---
  const [activeTab, setActiveTab] = useState('preview');
  const [resumeData, setResumeData] = useState<ResumeData | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');

  // Action States - Always start with loading to prevent hydration mismatch
  const [status, setStatus] = useState<'loading' | 'ready' | 'incomplete' | 'not-found' | 'error'>('loading');
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setRegenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Analysis & Reports State
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState<any>();
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [generatingCoverLetter, setRegeneratingCoverLetter] = useState(false);

  // Mobile Panel States
  const [mobileReportsOpen, setMobileReportsOpen] = useState(false);
  const [mobileTemplatesOpen, setMobileTemplatesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for click outside
  const mobileReportsRef = useRef<HTMLDivElement>(null);
  const mobileTemplatesRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);


  // Queries
  const response = useJobDescriptions(user ? user.id : '', slug);
  const resumeResponse = useGetResume(slug);

  // --- Effects ---

  // Check cache on mount (client-side only)
  useEffect(() => {
    const cached = ResumeCache.get(slug);
    if (cached?.data) {
      setResumeData(cached.data);
      setSelectedTemplate(cached.data.template ?? 'modern');
      setStatus(cached.data.profile?.fullname ? 'ready' : 'incomplete');
    }
  }, [slug]);

  // Load Resume Data
  useEffect(() => {
    if (!user) {
      // Guest logic
      const localResume = typeof window !== 'undefined' ? localStorage.getItem(slug) : null;
      if (localResume) {
        try {
          const parsed = JSON.parse(localResume);
          setResumeData(parsed);
          setStatus('ready');
        } catch {
          setStatus('not-found');
        }
      } else {
        setStatus('not-found');
      }
      return;
    }

    if (resumeResponse.isSuccess && resumeResponse.data) {
      const resume = resumeResponse.data;
      setResumeData(prev => {
        if (prev && prev.id === resume.id && prev.template === resume.template) return prev;
        setSelectedTemplate(resume.template);
        setStatus(resume.profile?.fullname ? 'ready' : 'incomplete');
        return resume;
      });
    } else if (resumeResponse.isError) {
      setStatus('error');
    }
  }, [resumeResponse.isSuccess, resumeResponse.data, resumeResponse.isError, user, slug]);

  // Load Analysis Data
  useEffect(() => {
    if (!response || !response.isSuccess || !response.data) return;
    const data = response.data.data || [];
    const analysisItem: any[] = [];

    for (const details of data) {
      if (details.hasAnalysed && details.analysis) {
        try {
          const parsed = typeof details.analysis.result === 'string'
            ? JSON.parse(details.analysis.result as string)
            : details.analysis.result;

          analysisItem.push({
            ...parsed,
            _analysisId: details.analysis.id,
            _jobDescriptionId: details.id,
            _analysedDate: details.analysis.updatedAt,
            _company: details.company,
            _title: details.title,
            _url: details.url,
            _jobCreatedDate: details.cretedAt
          });
        } catch (err) {
          console.warn('Failed to parse analysis result', err);
        }
      }
    }
    setAnalysisData(analysisItem);
  }, [response.isSuccess, response.data]);

  // Close mobile panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileReportsOpen && mobileReportsRef.current && !mobileReportsRef.current.contains(event.target as Node)) {
        setMobileReportsOpen(false);
      }
      if (mobileTemplatesOpen && mobileTemplatesRef.current && !mobileTemplatesRef.current.contains(event.target as Node)) {
        setMobileTemplatesOpen(false);
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileReportsOpen, mobileTemplatesOpen, mobileMenuOpen]);


  // --- Actions ---

  const handleEdit = () => {
    router.push(`/builder/${slug}`);
  };

  const handleTemplateChange = async (templateId: string) => {
    if (!resumeData) return;
    setSelectedTemplate(templateId);

    // Optimistic Update
    const updatedData = { ...resumeData, template: templateId };
    setResumeData(updatedData);
    ResumeCache.set(slug, updatedData, true);

    if (user) {
      try {
        await ResumeService.save(user.id, slug, templateId, updatedData);
        ResumeCache.markSynced(slug);
      } catch (err) {
        console.error("Failed to save template preference", err);
      }
    }
  };

  const handleRegenerate = async (targetResume?: ResumeData, targetAnalysis?: any) => {
    if (!user) return showToast('Please sign in to regenerate', 'info');
    if (generating) return;

    setRegenerating(true);
    showToast(
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
        <span>Optimizing your resume with AI...</span>
      </div>,
      'info',
      5000
    );

    try {
      const dataToUse = targetResume || resumeData;
      if (!dataToUse) throw new Error("No resume data");

      const res = await ResumeService.regenerate(dataToUse, undefined, targetAnalysis || selectedAnalysis);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Regeneration failed");

      // Save updated resume
      await ResumeService.save(dataToUse.userId, dataToUse.id, dataToUse.template, data.resume);

      // Update State
      setResumeData({
        ...dataToUse,
        ...data.resume,
        template: dataToUse.template
      });

      showToast('Resume optimized successfully!', 'success');
      await getSubscription(false);

    } catch (err) {
      console.error(err);
      showToast('Transformation failed. Please try again.', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData || !user) return showToast('Please login to download', 'warning');

    setDownloading(true);
    showToast(
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span>Preparing PDF download...</span>
      </div>,
      'info'
    );

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, template: selectedTemplate }),
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFile(resumeData.profile.fullname || 'Resume')}_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast('Download started!', 'success');
      await getSubscription(false);
    } catch (err) {
      console.error(err);
      showToast('Error downloading PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const performDelete = async () => {
    if (!resumeData) return;
    setDeleting(true);

    try {
      if (user) {
        await ResumeService.delete(resumeData.id);
      } else {
        localStorage.removeItem(slug);
      }
      showToast('Resume deleted', 'success');
      router.push('/builder');
    } catch (err) {
      showToast('Delete failed', 'error');
      setDeleting(false);
    }
  };

  // Analysis Actions
  const handleReAnalysis = async (analysis: any) => {
    setAnalyzing(true);
    showToast('Updating analysis...', 'info');
    try {
      const res = await analyzeResume({ resumeId: slug, jobDescriptionId: analysis._jobDescriptionId });
      if (res.ok && res.data) {
        // Optimistically update the list
        const updated = res.data;
        const parsed = typeof updated.result === 'string' && updated.result ? JSON.parse(updated.result) : updated.result || {};

        setAnalysisData(prev => prev.map(item =>
          item._analysisId === updated.id
            ? { ...item, ...parsed, _analysedDate: updated.updatedAt }
            : item
        ));

        showToast('Analysis updated', 'success');
      }
    } catch (err) {
      showToast('Analysis update failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateCoverLetter = async (analysis: any) => {
    if (!resumeData || !user) return;
    setRegeneratingCoverLetter(true);
    showToast('Drafting cover letter...', 'info');

    try {
      const response = await fetch('/api/ai/generate-coverletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeData.id,
          jobDescriptionId: analysis._jobDescriptionId,
          analysis,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setCoverLetter(data.data);
      setShowCoverLetter(true);
      localStorage.setItem('coverLetter', JSON.stringify(data.data));
      showToast('Cover letter ready!', 'success');

    } catch (err) {
      showToast('Cover letter generation failed', 'error');
    } finally {
      setRegeneratingCoverLetter(false);
    }
  };


  // --- Render Helpers ---

  if (status === 'loading') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 gap-4">
        <Loader2 className="h-10 w-10 text-teal-500 animate-spin" />
        <p className="text-slate-500 animate-pulse">Loading Workspace...</p>
      </div>
    )
  }

  if (status === 'not-found' || !resumeData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 gap-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Resume Not Found</h2>
        <Button variant="primary" size="medium" onClick={() => router.push('/builder')}>Return to Builder</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900/50 flex flex-col">

      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Left: Edit Action */}
          <div className="flex-1">
            <Button
              variant="secondary"
              size="small"
              onClick={handleEdit}
              className="hidden sm:flex items-center gap-2"
            >
              <Edit size={16} /> Edit Resume
            </Button>
            <button onClick={handleEdit} className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 rounded-full">
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Center: Tabs (Desktop Only) */}
          <div className="flex-shrink-0 hidden lg:block">
            <AnimatedTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'preview', label: 'Preview', icon: FileText },
                { id: 'analysis', label: 'Analysis', icon: BarChart2 },
                { id: 'templates', label: 'Templates', icon: LayoutTemplate },
              ]}
            />
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={() => handleRegenerate()}
              disabled={generating}
              className="hidden sm:flex text-teal-600 dark:text-teal-400"
            >
              <Bot size={16} />
              {generating ? 'Optimizing...' : 'Regenerate'}
            </Button>

            <Button
              variant="primary"
              size="small"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="shadow-lg shadow-blue-500/20"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area - Split View */}
      <main className="flex-1 w-full relative flex overflow-hidden">

        {/* Left Panel: Resume Preview */}
        <div className={`flex-1 bg-gray-100/50 dark:bg-slate-900/50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'} transition-all duration-300`}>
          <div className="min-h-full flex items-center justify-center py-8 px-4 pb-24 lg:pb-8">
            <div className={`transition-all duration-500 ease-in-out ${activeTab === 'preview' ? 'w-full max-w-[210mm]' : 'w-full max-w-[210mm] lg:max-w-[480px] xl:max-w-[210mm]'}`}>
              <ResumePreview
                resumeData={resumeData}
                template={selectedTemplate}
                regenerating={generating}
                className="shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Desktop Right Panel: Analysis / Templates */}
        {(activeTab === 'analysis' || activeTab === 'templates') && (
          <div className="hidden lg:flex w-[450px] xl:w-[500px] bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex-col h-full shadow-2xl z-20 animate-in slide-in-from-right-10 duration-200">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 p-4">
              {activeTab === 'analysis' && (
                <ReportsPanel
                  reports={true}
                  analysisData={analysisData}
                  selectedAnalysis={selectedAnalysis}
                  setSelectedAnalysis={setSelectedAnalysis}
                  handleReAnalysis={handleReAnalysis}
                  handleRegenerate={handleRegenerate}
                  resumeData={resumeData!}
                  analyzing={analyzing}
                  generating={generating}
                  reportsRef={React.createRef()}
                  generatingCoverLetter={generatingCoverLetter}
                  generateCoverLetter={generateCoverLetter}
                />
              )}

              {activeTab === 'templates' && (
                <TemplatesPanel
                  displayTemplate={user ? Templates : Templates.slice(0, 3)}
                  selectedTemplate={selectedTemplate}
                  handleTemplateChange={handleTemplateChange}
                  user={user ? { id: user.id } : null}
                  templatesRef={React.createRef()}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Panels - Fixed to viewport */}
      <div className="lg:hidden">
        {mobileReportsOpen && (
          <div ref={mobileReportsRef} className="fixed bottom-20 left-0 right-0 z-40 px-3 animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[65vh] overflow-y-auto border border-gray-200 dark:border-slate-700 mx-auto max-w-md">
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b flex justify-between items-center z-10 px-4">
                <h3 className="font-bold">Analysis</h3>
                <button onClick={() => setMobileReportsOpen(false)}><X size={18} /></button>
              </div>
              <ReportsPanel
                reports={true}
                analysisData={analysisData}
                selectedAnalysis={selectedAnalysis}
                setSelectedAnalysis={setSelectedAnalysis}
                handleReAnalysis={handleReAnalysis}
                handleRegenerate={handleRegenerate}
                resumeData={resumeData!}
                analyzing={analyzing}
                generating={generating}
                reportsRef={React.createRef()}
                generatingCoverLetter={generatingCoverLetter}
                generateCoverLetter={generateCoverLetter}
              />
            </div>
          </div>
        )}

        {mobileTemplatesOpen && (
          <div ref={mobileTemplatesRef} className="fixed bottom-20 left-0 right-0 z-40 px-3 animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[65vh] overflow-y-auto border border-gray-200 dark:border-slate-700 mx-auto max-w-md">
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b flex justify-between items-center z-10 px-4">
                <h3 className="font-bold">Templates</h3>
                <button onClick={() => setMobileTemplatesOpen(false)}><X size={18} /></button>
              </div>
              <TemplatesPanel
                displayTemplate={user ? Templates : Templates.slice(0, 3)}
                selectedTemplate={selectedTemplate}
                handleTemplateChange={handleTemplateChange}
                user={user ? { id: user.id } : null}
                templatesRef={React.createRef()}
              />
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="fixed bottom-20 left-0 right-0 z-40 px-3 animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[65vh] overflow-y-auto border border-gray-200 dark:border-slate-700 mx-auto max-w-md">
              <MenuPanel
                menu={mobileMenuOpen}
                setShowConfirm={setShowConfirm}
                slug={slug}
                menuRef={mobileMenuRef}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe">
        <div className="flex items-center justify-around p-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMobileReportsOpen(!mobileReportsOpen);
              setMobileTemplatesOpen(false);
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 ${mobileReportsOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            <BarChart2 size={24} />
            <span className="text-[10px] font-medium">Analysis</span>
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMobileTemplatesOpen(!mobileTemplatesOpen);
              setMobileReportsOpen(false);
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 ${mobileTemplatesOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            <LayoutTemplate size={24} />
            <span className="text-[10px] font-medium">Templates</span>
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
              setMobileReportsOpen(false);
              setMobileTemplatesOpen(false);
            }}
            className={`flex flex-col items-center gap-1 ${mobileMenuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Footer / Danger Zone (Desktop Only) */}
      <div className="w-full py-8 text-center bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 mt-auto hidden lg:block">
        <div className="max-w-xs mx-auto">
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-400 hover:text-red-500 hover:underline flex items-center justify-center gap-1 w-full"
          >
            <Trash size={12} /> Delete this resume permanently
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={performDelete}
        loading={deleting}
        title="Delete Resume?"
        message="Are you sure? This cannot be undone."
        confirmText="Delete Resume"
      />

      {/* Cover Letter Modal */}
      {showCoverLetter && coverLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg dark:text-white">Generated Cover Letter</h3>
              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter.parsed?.coverLetter || coverLetter.coverLetter || '');
                    showToast('Copied!', 'success');
                  }}
                >Copy</Button>
                <Button size="small" variant="ghost" onClick={() => setShowCoverLetter(false)}><X size={16} /> Close</Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 lg:p-10 prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                {coverLetter.parsed?.coverLetter || coverLetter.coverLetter}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PreviewPage;
