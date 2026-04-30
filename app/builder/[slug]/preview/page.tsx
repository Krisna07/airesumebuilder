/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { AnalysisResult, JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { analyzeResume, ResumeService } from '@/services/resumeServices';
import { LocalResumeService } from '@/services/localResumeService';
import { Bot, Download, Edit, Plus, Trash, Loader2, BotIcon, X, FileUser, FileSliders, Copy, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import Button from '@/components/Ui/Button';
import ConfirmDialog from '@/components/Ui/ConfirmDialog';
import Templates from '@/components/Templates/templates';
import ReportsPanel from './ReportsPanel';
import MenuPanel from './MenuPanel';
import JobDescription from '@/components/Forms/JobDescription';
import { useJobDescriptions } from '@/hooks/useJobDescriptions';
import { useGetResume } from '@/hooks/useResume';
import { JobDescriptionService } from '@/services/jdServices';
import { ResumeCache } from '@/lib/resumeCache';
import LiquidNav from './LiqidNav';
import StylePanel from './StylePanel';
import { ResumeStyle } from '@/types/types';
import { DEFAULT_RESUME_STYLE } from '@/lib/defaultStyle';


const sanitizeFile = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '');

type GuestUsageSnapshot = {
  download: { used: number; remaining: number; limit: number };
  regen: { used: number; remaining: number; limit: number };
  lastResetDate: string;
};

const PreviewPage = () => {
  const params = useParams();
  const slug = (params?.slug ?? "") as string;
  const { user, getSubscription } = useAuth();
  const { showToast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [status, setStatus] = useState<'loading' | 'ready' | 'incomplete' | 'not-found' | 'error'>('loading');
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [downlaoding, setDownloading] = useState<boolean>(false)
  const [generating, setRegenerating] = useState<boolean>(false)
  const [pendingUpdate, setPendingUpdate] = useState(false); // keep stale resume during async ops
  const [analysisData, setAnalysisData] = useState<any>()
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [menu, showMenu] = useState<boolean>(false)
  const [reports, showReports] = useState<boolean>(false)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [showTemplates, setShowTemplates] = useState<boolean>(false)
  const [showStyles, setShowStyles] = useState<boolean>(false)
  const [showDesktopAnalysis, setShowDesktopAnalysis] = useState<boolean>(false)
  const [generatingCoverLetter, setRegeneratingCoverLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState<any>()
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [jobDetails, setJobDetails] = useState<JobDetailsWithAnalysis[]>()
  const [guestUsage, setGuestUsage] = useState<GuestUsageSnapshot | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);
  const stylesRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const styleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGuestResume = slug === 'guest-resume';
  const usesRemoteResume = Boolean(user && !isGuestResume);
  const response = useJobDescriptions(user ? user.id : '', slug)
  const resumeResponse = useGetResume(isGuestResume ? "" : slug)

  const loadGuestUsage = React.useCallback(async () => {
    if (user) return;

    try {
      const usageResponse = await fetch('/api/guest-usage', {
        credentials: 'include',
      });
      if (!usageResponse.ok) return;
      const data = await usageResponse.json();
      setGuestUsage(data);
    } catch (error) {
      console.warn('Failed to load guest usage', error);
    }
  }, [user]);

  const refreshUsageState = React.useCallback(async () => {
    if (user) {
      await getSubscription(false);
      return;
    }

    await loadGuestUsage();
  }, [getSubscription, loadGuestUsage, user]);

  const hydrateFromCache = React.useCallback(() => {
    const cached = ResumeCache.get(slug);
    if (!cached?.data) return false;

    setResumeData(cached.data);
    setSelectedTemplate(cached.data.template ?? 'modern');
    const hasMinimum = !!(cached.data.profile?.fullname && cached.data.profile?.email);
    setStatus(hasMinimum ? 'ready' : 'incomplete');
    return true;
  }, [slug]);

  const loadLocalResume = React.useCallback(() => {
    const localResume = typeof window !== 'undefined' ? localStorage.getItem(slug) : null;
    if (localResume) {
      try {
        const parsed = JSON.parse(localResume);
        setResumeData(parsed);
        setSelectedTemplate(parsed?.template ?? 'modern');
        const hasMinimum = !!(parsed?.profile?.fullname && parsed?.profile?.email);
        setStatus(hasMinimum ? 'ready' : 'incomplete');
      } catch {
        setStatus('not-found');
      }
    } else {
      setStatus('not-found');
    }
    return;
  }, [slug]);

  useEffect(() => {
    hydrateFromCache();
  }, [hydrateFromCache]);

  useEffect(() => {
    if (!user) {
      return loadLocalResume()
    }

    if (resumeResponse.isFetched && resumeResponse.isError) {
      // avoid re-setting identical status/toast repeatedly
      setStatus(prev => (prev === 'not-found' ? prev : 'not-found'));
      showToast(resumeResponse.error?.message || 'No resume data found', 'warning', 2500);
      return;
    }

    if (resumeResponse.isSuccess && resumeResponse.data) {
      const resume = resumeResponse.data
      // only update local state if data changed
      setResumeData(prev => {
        if (prev && prev.id === resume.id) return prev;
        setSelectedTemplate(resume.template);
        const hasMinimum = !!(resume.profile?.fullname && resume.profile?.email);
        setStatus(hasMinimum ? 'ready' : 'incomplete');
        return resume;
      })
    }
    // watch only primitive flags and stable callbacks to avoid effect instability
  }, [resumeResponse.isFetched, resumeResponse.isError, resumeResponse.isSuccess, user, loadLocalResume, showToast, resumeResponse.data, resumeResponse.error?.message])

  useEffect(() => {
    return () => {
      if (styleSaveTimerRef.current) {
        clearTimeout(styleSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      void loadGuestUsage();
    }
  }, [loadGuestUsage, user]);

  // Load local coverletter once on mount
  useEffect(() => {
    const localCoverletter = typeof window !== 'undefined' ? localStorage.getItem('coverLetter') : null;
    if (typeof localCoverletter === 'string') {
      try {
        const localData = JSON.parse(localCoverletter);
        setCoverLetter(localData);
      } catch (err) {
        console.warn('Failed to parse local cover letter', err);
      }
    }
  }, []);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      // ignore clicks from top bar icons
      if (topBarRef.current && target && topBarRef.current.contains(target)) return;
      if (menu && menuRef.current && target && !menuRef.current.contains(target)) {
        showMenu(false);
      }
      if (reports && reportsRef.current && target && !reportsRef.current.contains(target)) {
        showReports(false);
      }
      if ((showStyles || showTemplates) && stylesRef.current && target && !stylesRef.current.contains(target)) {
        setShowStyles(false);
        setShowTemplates(false);
      }
    };

    const handleScroll = () => {
      showMenu(false);
      setShowTemplates(false);
      setShowStyles(false);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [menu, reports, showTemplates, showStyles, showToast]);


  // Process job descriptions when the query completes successfully
  useEffect(() => {
    if (!response || !response.isSuccess || !response.data) return;
    const data: JobDetailsWithAnalysis[] = response.data.data || [];
    setJobDetails(data)
    const analysisItem: any[] = [];
    for (const details of data) {
      if (details.hasAnalysed) {
        const analysis = details.analysis;
        if (analysis) {
          try {
            const parsed = typeof analysis.result === 'string' ? JSON.parse(analysis.result as string) : analysis.result;
            analysisItem.push({
              ...parsed,
              _analysisId: analysis.id,
              _jobDescriptionId: details.id,
              _analysedDate: analysis.updatedAt,
              _company: details.company,
              _title: details.title,
              _url: details.url,
              _jobCreatedDate: details.cretedAt
            });
          } catch (err) {
            console.warn('Failed to parse analysis result for', details.id, err);
          }
        }
      }
    }
    if (analysisItem.length > 0) {
      setAnalysisData(analysisItem);
    }
  }, [response.isSuccess, response.data]);

  const handleTemplateChange = async (templateId: string) => {
    if (!resumeData) return;
    setPendingUpdate(true);
    setSelectedTemplate(templateId);

    // Update cache immediately (optimistic update)
    const updatedData = { ...resumeData, template: templateId };
    ResumeCache.set(slug, updatedData, true);

    if (typeof window !== 'undefined' && user) {
      try {
        await ResumeService.save(user.id, slug, templateId, updatedData);
        ResumeCache.markSynced(slug);
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

  const scheduleStyleSave = (updatedData: ResumeData) => {
    if (!user || typeof window === 'undefined') return;
    if (styleSaveTimerRef.current) {
      clearTimeout(styleSaveTimerRef.current);
    }

    styleSaveTimerRef.current = setTimeout(async () => {
      try {
        await ResumeService.save(user.id, slug, updatedData.template, updatedData);
        ResumeCache.markSynced(slug);
      } catch (e) {
        console.error('Failed to save style to backend:', e);
      }
    }, 350);
  };

  const handleStyleChange = (newStyleParams: Partial<ResumeStyle>) => {
    setResumeData((prev) => {
      if (!prev) return prev;
      const currentStyle = {
        ...DEFAULT_RESUME_STYLE,
        ...(prev.styleConfig || {}),
        sectionTitleStyle: {
          ...DEFAULT_RESUME_STYLE.sectionTitleStyle,
          ...(prev.styleConfig?.sectionTitleStyle || {}),
        },
      };

      const updatedData = {
        ...prev,
        styleConfig: {
          ...currentStyle,
          ...newStyleParams,
          sectionTitleStyle: {
            ...currentStyle.sectionTitleStyle,
            ...newStyleParams.sectionTitleStyle,
          }
        } as ResumeStyle
      };

      ResumeCache.set(slug, updatedData, true);
      scheduleStyleSave(updatedData);
      return updatedData;
    });
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) {
      showToast('Resume data not available', 'error', 2000);
      return;
    }

    // Use cached data if available (faster)
    const cached = ResumeCache.get(slug);
    const dataToUse = (cached?.data ?? resumeData)!;

    setDownloading(true);
    setRegenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeData: dataToUse,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ PDF generation error:', errorData);
        showToast(errorData?.details || errorData?.error || 'PDF generation failed', 'error', 3000);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error(`Invalid response type: ${contentType}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = sanitizeFile(dataToUse.profile.fullname || 'Resume');
      a.href = url;
      a.download = `${name}_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('PDF downloaded', 'success', 1500);
      await refreshUsageState();
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showToast('Error generating PDF. Please try again.', 'error', 3000);
    } finally {
      setDownloading(false);
      setRegenerating(false);
    }
  };


  const performDelete = async () => {
    if (!resumeData) return;
    setDeleting(true);
    if (!user) {
      localStorage.removeItem(slug);
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

  const handleRegerate = async (resumeData: ResumeData, analysis?: AnalysisResult, jobDescription?: any) => {
    setRegenerating(true);
    setPendingUpdate(true);
    showToast('Generating resume')
    try {
      const response = await ResumeService.regenerate(resumeData, jobDescription, analysis);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data?.error || data?.details || 'Error regenerating resume', 'error', 3000);
        return;
      }

      const nextResume: ResumeData = {
        ...resumeData,
        template: selectedTemplate,
        profile: data.resume.profile,
        skills: data.resume.skills,
        experiences: data.resume.experiences,
        educations: data.resume.educations,
        customSections: data.resume.customSections,
        styleConfig: data.resume.styleConfig ?? resumeData.styleConfig,
      };

      if (user) {
        const updatedResume = await ResumeService.save(
          resumeData.userId,
          resumeData.id,
          selectedTemplate,
          nextResume,
        );

        if (!updatedResume.ok) {
          return showToast(
            'Error saving the resume, the data isnot saved to database',
            'warning',
            4000,
          );
        }

        ResumeCache.markSynced(slug);
      } else {
        await LocalResumeService.update(slug, nextResume);
      }

      ResumeCache.set(slug, nextResume, false);
      setResumeData(nextResume);
      showToast('Resume has been regenerated Successfully', 'success', 3000);
      await refreshUsageState();
      return;
    } catch (error) {
      console.error('Resume regeneration error:', error);
      showToast('Error regenerating resume', 'error', 3000);
    } finally {
      setRegenerating(false);
      setPendingUpdate(false);
    }
  };

  const handleReAnalysis = async (analysis: any) => {
    setAnalyzing(true)
    const resumeId = slug
    const jobDescriptionId = analysis._jobDescriptionId
    const response = await analyzeResume({
      resumeId,
      jobDescriptionId
    })
    if (!response.ok) {
      setAnalyzing(false)
    }
    const data = response.data
    try {
      // response.data should contain the updated analysis record with fields like id and result
      if (data && data.id) {
        const refreshed = typeof data.result === 'string' && data.result ? JSON.parse(data.result) : data.result || {};
        setAnalysisData((prev: any[] | undefined) => (prev || []).map((a: any) => ((a as any)._analysisId === data.id) ? ({ ...(refreshed as any), _analysisId: data.id, _jobDescriptionId: data.jobDescriptionId, _analysedDate: data.updatedAt }) : a));
        showToast('Analysis updated', 'success', 1500);
        // Avoid forced refresh; server updates usage
        await getSubscription(false);
      }
    } catch (err) {
      console.warn('Failed to merge refreshed analysis:', err, data);
    } finally {
      setAnalyzing(false);
    }
  }

  const generateCoverLetter = async (analysis: any) => {
    setRegeneratingCoverLetter(true);
    try {
      if (!user || !resumeData) {
        showToast('Please login to use this feature', 'warning', 3000);
        setRegeneratingCoverLetter(false);
        return;
      }

      const jobDescriptionId = analysis?._jobDescriptionId;
      if (!jobDescriptionId) {
        showToast('Select an analysis first', 'warning', 2000);
        setRegeneratingCoverLetter(false);
        return;
      }

      const response = await fetch('/api/ai/generate-coverletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeId: resumeData.id,
          jobDescriptionId,
          analysis: analysis || undefined,
        }),
      });

      if (!response.ok) {
        showToast('Error generating coverletter', 'error', 3000);
        setShowCoverLetter(false);
        setRegeneratingCoverLetter(false);
        return;
      }

      const data = await response.json();
      setCoverLetter(data.data);
      setShowCoverLetter(true);
      localStorage.setItem('coverLetter', JSON.stringify(data.data));
      setRegeneratingCoverLetter(false);
      // Avoid forced refresh; server updates usage
      await getSubscription(false);
    } catch (error) {
      console.error('Cover letter generation error:', error);
      showToast('Error generating coverletter', 'error', 3000);
      setRegeneratingCoverLetter(false);
    }
  };

  const deletAnalysisReport = async (id: string) => {
    if (!resumeData) {
      showToast("Cannot delete this report", 'error', 3000)
      return
    }
    try {
      const deleteResponse = await JobDescriptionService.removeAnalysisReport(id, resumeData.id)
      if (!deleteResponse.ok) {
        showToast('Sorry, we cannot delete this report at the moment, Please try again.', 'error', 3000)
      }
      const remainingAnalysis = analysisData.filter((analysis: any) => analysis._analysisId !== id)
      setAnalysisData(remainingAnalysis)
      response.refetch()
    } catch (error) {
      throw error
    }
  }

  const loadingResume = usesRemoteResume && (resumeResponse.isLoading || resumeResponse.isFetching);

  // Unified rendering logic to prevent 'No Resume Data' flash
  if (loadingResume || (!resumeData && status === 'loading')) {
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

  if (status === 'incomplete') {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center p-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Incomplete Resume</h2>
          <p className="text-gray-600 mb-6">
            Please complete at least your name and email before previewing.
          </p>
          <Button
            variant="secondary"
            size="small"
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
    return (
      <div
        className={`relative  transition-all duration-300 ${fadeOut ? 'opacity-0 scale-[0.985]' : ''}`}
      >
        <div ref={topBarRef} className='min-[500px]:hidden fixed inset-x-0 bottom-0 z-100 flex items-center justify-between'>
          {/* <div className='w-full flex items-start justify-between relative shadow dark:bg-gray-800 bg-gray-200  p-4'>
            <BarChart2Icon onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {
              e.stopPropagation();
              showMenu(false);
              setShowTemplates(false);
              showReports(!reports);
            }} className={`${reports ? 'text-blue-600  scale-110' : ''} transition-all ease-in-out  w-fit`} />

            <BookTemplateIcon
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                showReports(false);
                showMenu(false);
                setShowTemplates(!showTemplates);
              }}
              className={`${showTemplates ? 'text-blue-600 scale-105' : ''} transition-all ease-in-out  w-fit`}
            />
            <SettingsIcon onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {
              e.stopPropagation();
              showReports(false);
              setShowTemplates(false);
              showMenu(!menu);
            }} className={`${menu ? 'text-blue-600 scale-105 rotate-180' : ''} transition-all ease-in-out`} />
          </div> */}
          <LiquidNav
            reports={reports}
            showReports={showReports}
            showStyles={showStyles}
            setShowStyles={setShowStyles}
            menu={menu}
            showMenu={showMenu}
          />

          {reports && (
            // <div className='w-full absolute bottom-0 pb-12 grid place-items-start z-10  p-4 panel-from-left'>
            <div className='w-full max-h-[70vh] md:max-h-[70vh] overflow-auto absolute bottom-0 pb-12 z-10'>
                <ReportsPanel
                  reports={reports}
                  analysisData={analysisData}
                  selectedAnalysis={selectedAnalysis}
                  setSelectedAnalysis={setSelectedAnalysis}
                  handleReAnalysis={handleReAnalysis}
                  handleRegenerate={handleRegerate}
                  generateCoverLetter={generateCoverLetter}
                  generatingCoverLetter={generatingCoverLetter}
                  resumeData={resumeData}
                  analyzing={analyzing}
                  generating={generating}
                  reportsRef={reportsRef}
                />
              </div>
            // </div>
          )}

          {showTemplates && resumeData && <div className='w-full absolute bottom-12 p-4 panel-from-center'>
            <StylePanel
              resumeData={resumeData}
              templateId={selectedTemplate}
              handleStyleChange={handleStyleChange}
              stylesRef={stylesRef}
              templateOptions={displayTemplate}
              onTemplateChange={handleTemplateChange}
              userSignedIn={Boolean(user)}
            />
          </div>}

          {showStyles && resumeData && <div className='w-full absolute bottom-12 p-4 panel-from-center'>
            <StylePanel
              resumeData={resumeData}
              templateId={selectedTemplate}
              handleStyleChange={handleStyleChange}
              stylesRef={stylesRef}
              templateOptions={displayTemplate}
              onTemplateChange={handleTemplateChange}
              userSignedIn={Boolean(user)}
            />
          </div>}

          {menu && <div className='w-full absolute bottom-12 p-4 panel-from-right'>
            <MenuPanel
              menu={menu}
              setShowConfirm={setShowConfirm}
              slug={slug}
              menuRef={menuRef}
            />
          </div>}
        </div>
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 grid gap-4 mt-2">
          {/* Actions */}
          <div className="w-full flex max-sm:justify-between justify-center  gap-1 gap-y-2 md:gap-3 min-[500px]:flex-wrap text-[14px]">
            <button
              onClick={handleDownloadPDF}
              disabled={deleting || downlaoding || generating}
              className={`max-[500px]:w-full px-4 py-1 bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${deleting || downlaoding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              <Download size={16} /> Download
            </button>

            <button
              onClick={() => (window.location.href = `/builder/${slug}`)}
              className="max-[500px]:hidden px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center gap-2"
            >
              <Edit size={16} /> Edit Resume
            </button>

            <button
              onClick={() => (window.location.href = '/builder')}
              // disabled={user ? false : true}
              className="max-[500px]:hidden px-4 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> New Resume
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              className={`max-[500px]:hidden px-4 py-1 bg-red-200 text-gray-800 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${deleting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-400'}`}
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}{' '}
              {deleting ? 'Deleting' : 'Delete'}
            </button>

            <button
              onClick={() => handleRegerate(resumeData, selectedAnalysis)}
              className={`max-[500px]:w-full px-4 py-1 bg-green-200 text-gray-800 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${generating ? 'animate-pulse' : 'hover:bg-green-400'} ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={generating || downlaoding || deleting}
            >
              <Bot size={16} /> {generating ? 'Generating...' : 'Re-Generate'}
            </button>

            <button
              onClick={() => {
                showReports(false);
                setShowTemplates(false);
                showMenu(false);
                setShowStyles((prev) => !prev);
              }}
              className="hidden min-[500px]:max-[800px]:flex px-4 py-1 bg-teal-100 text-teal-800 rounded-lg transition-colors font-medium shadow-md items-center gap-2 hover:bg-teal-200"
            >
              <Edit size={16} /> {showStyles ? 'Hide Style Editor' : 'Edit Style & Order'}
            </button>
          </div>

          {!user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {guestUsage
                ? `Guest daily limits: ${guestUsage.download.remaining}/${guestUsage.download.limit} downloads left, ${guestUsage.regen.remaining}/${guestUsage.regen.limit} regenerations left.`
                : 'Guest daily limits: 5 downloads and 5 regenerations.'}
            </div>
          )}

          {showStyles && resumeData && (
            <div className="hidden min-[500px]:max-[800px]:block w-full">
              <StylePanel
                resumeData={resumeData}
                templateId={selectedTemplate}
                handleStyleChange={handleStyleChange}
                stylesRef={stylesRef}
                templateOptions={displayTemplate}
                onTemplateChange={handleTemplateChange}
                userSignedIn={Boolean(user)}
              />
            </div>
          )}

          {coverLetter &&
            <Button disabled={generating || generatingCoverLetter} variant='secondary' className={`md:w-fit  ${generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => setShowCoverLetter(true)} ><FileSliders size={14} />Show Cover letter</Button>
          }
          {jobDetails && jobDetails?.length > 0 &&
            <div className='max-[500px]:hidden w-full rounded-xl border border-slate-700/60'>
              <div className='flex items-center justify-between px-4 py-3 border-b border-slate-700'>
                <div>
                  <h3 className='font-semibold text-slate-100'>Analysis</h3>
                  <p className='text-xs text-slate-400'>{analysisData?.length ?? 0} report(s)</p>
                </div>
                <button
                  type='button'
                  onClick={() => setShowDesktopAnalysis((prev) => !prev)}
                  className='inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800'
                >
                  {showDesktopAnalysis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showDesktopAnalysis ? 'Hide' : 'Show'}
                </button>
              </div>

              {showDesktopAnalysis && (
                <div className='p-3 space-y-3'>
                  <div className='max-h-[260px] overflow-auto space-y-2 pr-1'>
                    {analysisData && analysisData.length > 0 && analysisData.map((analysis: any) => {
                      const isSelected = selectedAnalysis?._analysisId === analysis._analysisId;
                      const score = Math.max(0, Math.min(100, Math.round(Number(analysis.matchingPercentage ?? 0))));
                      return (
                        <div
                          key={analysis._analysisId}
                          onClick={() => setSelectedAnalysis(analysis)}
                          className={`rounded-lg border p-2 cursor-pointer ${isSelected ? 'border-teal-500 bg-slate-800' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'}`}
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div className='min-w-0'>
                              <div className='text-sm font-semibold text-slate-100 truncate'>{analysis._title || analysis.role || 'Analysis report'}</div>
                              <div className='text-xs text-slate-400 truncate'>{analysis._company || analysis.company || 'Unknown company'}</div>
                            </div>
                            <span className='text-xs font-semibold text-teal-300 bg-teal-900/40 px-2 py-0.5 rounded'>{score}%</span>
                          </div>

                          <div className='mt-2 flex flex-wrap items-center gap-2'>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReAnalysis(analysis);
                              }}
                              className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700'
                            >
                              <Search size={12} /> {isSelected && analyzing ? 'Analysing' : 'Analyse'}
                            </button>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegerate(resumeData, analysis);
                              }}
                              disabled={generating || generatingCoverLetter}
                              className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <BotIcon size={12} /> {isSelected && generating ? 'Optimising' : 'Optimise'}
                            </button>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                generateCoverLetter(analysis);
                              }}
                              disabled={generating || generatingCoverLetter}
                              className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <FileUser size={12} /> Cover Letter
                            </button>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                deletAnalysisReport(analysis._analysisId);
                              }}
                              className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-900/30'
                            >
                              <Trash size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className='pt-2 border-t border-slate-700'>
                    <JobDescription resumeId={resumeData.id} hideAnalysis={true} hideInput={true} hideTitle={true} handleRegenerate={handleRegerate} resumeData={resumeData} />
                  </div>
                </div>
              )}
            </div>
          }
          <div
            className="relative w-full min-h-fit overflow-auto rounded-xl border border-gray-200 shadow-sm"
            id="resumeViewport"
          >
            {/* Optional inner wrapper to constrain width / center */}
            <div className="w-full min-[800px]:grid-cols-[minmax(0,68%)_minmax(320px,32%)] grid items-start gap-3 p-2">
              <ResumePreview
                resumeData={resumeData}
                template={selectedTemplate}
                regenerating={generating}
                maxScale={0.88}
                className="w-full"
              />
              <div className="max-[500px]:hidden min-[800px]:block hidden w-full max-w-md space-y-3 sticky top-3 self-start max-h-[calc(100vh-4.5rem)] overflow-y-auto pr-1">
                <div className="w-full pt-2">
                  <StylePanel
                    resumeData={resumeData}
                    templateId={selectedTemplate}
                    handleStyleChange={handleStyleChange}
                    templateOptions={displayTemplate}
                    onTemplateChange={handleTemplateChange}
                    userSignedIn={Boolean(user)}
                  />
                </div>
              </div>
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

        {showCoverLetter && coverLetter && (
          <div className="fixed inset-0 z-90 grid place-items-center bg-black/30 p-4 top-4">
            <div className="relative w-full max-w-4xl h-[90vh] max-[500px]:h-[80vh] bg-white rounded-2xl shadow-lg overflow-auto py-4">
              <button
                aria-label="Close cover letter"
                onClick={() => setShowCoverLetter(false)}
                className="absolute right-4 top-4 text-gray-600 hover:text-gray-900"
              >
                <X />
              </button>
              <div className="sm:ml-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('coverletter');
                    const text = el ? el.innerText : (coverLetter.parsed?.coverLetter || coverLetter.coverLetter || '');
                    navigator.clipboard.writeText(text);
                    showToast('Copied to clipboard', 'success', 3000)
                    setShowCoverLetter(false)
                  }} className="ml-2 px-3 py-1  text-sm text-gray-700 rounded bg-gray-300 flex items-center justify-center gap-2 "
                >
                  <Copy className='w-4 h-4' /> Copy
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('coverletter');
                    const text = el ? el.innerText : (coverLetter.parsed?.coverLetter || coverLetter.coverLetter || '');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(resumeData?.profile?.fullname ?? 'coverletter')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 bg-blue-600  text-sm rounded hover:bg-blue-700"
                >
                  Download
                </button>
              </div>

              <div id="coverletter">
                <header className="flex text-gray-700 flex-col  items-start justify-between gap-4 p-6 ">
                  <div>
                    <div className="text-sm ">{coverLetter.userDetails?.fullname ?? '[Your Name]'}</div>
                    <div className="text-xs ">{coverLetter.userDetails?.location}</div>
                    <div className="text-xs ">{coverLetter.userDetails?.phone}</div>
                    <div className='text-xs'>{coverLetter.userDetails?.email}</div>
                  </div>

                  <div className="text-left">
                    <div className="text-xs ">{coverLetter.jobTitle ?? '[Job Title]'}</div>
                    <div className="text-xs ">{coverLetter.companyName ?? '[Company]'}</div>
                    <div className="text-xs ">{coverLetter.location ?? ''}</div>
                  </div>
                </header>
                <main className="p-6 space-y-6">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    <div className="mb-4 font-medium">{coverLetter.parsed?.salutation ?? coverLetter.salutation}</div>

                    <div className="prose prose-sm max-w-none text-gray-800">
                      {coverLetter.parsed?.coverLetter
                        ? <div className="whitespace-pre-wrap">{coverLetter.parsed.coverLetter}</div>
                        : <div className="whitespace-pre-wrap">{coverLetter.coverLetter}</div>}
                    </div>

                    <div className="mt-4 font-medium">{coverLetter.parsed?.closing ?? coverLetter.closing}</div>
                  </div>

                  {Array.isArray(coverLetter.keyParagraphs) && coverLetter.keyParagraphs.length > 0 && (
                    <section>
                      <h4 className="text-sm font-semibold mb-2">Key Paragraphs</h4>
                      <div className="grid gap-3">
                        {coverLetter.keyParagraphs.map((kp: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-700">
                            <div className="text-xs text-gray-500 font-medium">{kp.purpose}</div>
                            <div className="whitespace-pre-wrap">{kp.text}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {Array.isArray(coverLetter.highlights) && coverLetter.highlights.length > 0 && (
                    <section>
                      <h4 className="text-sm font-semibold mb-2">Highlights</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {coverLetter.highlights.map((h: any, i: number) => (
                          <li key={i}><span className="font-medium">{h.title ? `${h.title}: ` : ''}</span>{h.text}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </main>
              </div>
            </div>
          </div>
        )
        }

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

  if (usesRemoteResume && resumeResponse.isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-600 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Resume</h2>
          <p className="text-gray-600 mb-6">An unexpected error occurred. Redirecting…</p>
        </div>
      </div>
    );
  }
  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-600 flex items-center justify-center">
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
