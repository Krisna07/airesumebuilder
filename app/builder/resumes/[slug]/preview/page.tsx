/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AnalysisResult, JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { analyzeResume, ResumeService } from '@/services/resumeServices';
import { LocalResumeService } from '@/services/localResumeService';
import { Download, Edit, Trash, Loader2, X, FileUser, FileSliders, Copy, Search, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from '@/lib/analytics/events';
import { normalizeTemplateIdentifier } from '@/lib/templateCreator';


const sanitizeFile = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '');

type GuestUsageSnapshot = {
  download: { used: number; remaining: number; limit: number };
  regen: { used: number; remaining: number; limit: number };
  lastResetDate: string;
};

type CustomTemplateListItem = {
  name: string;
  baseTemplateId: string;
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
  const [downloading, setDownloading] = useState<boolean>(false)
  const [generating, setRegenerating] = useState<boolean>(false)
  const [pendingUpdate, setPendingUpdate] = useState(false); // keep stale resume during async ops
  const [analysisData, setAnalysisData] = useState<any>()
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [menu, showMenu] = useState<boolean>(false)
  const [reports, showReports] = useState<boolean>(false)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [showTemplates, setShowTemplates] = useState<boolean>(false)
  const [showStyles, setShowStyles] = useState<boolean>(false)
  const [showDesktopAnalysis, setShowDesktopAnalysis] = useState<boolean>(true)
  const [showDesktopJobForm, setShowDesktopJobForm] = useState<boolean>(false)
  const [pdfMatchPreview, setPdfMatchPreview] = useState<boolean>(true)
  const [generatingCoverLetter, setRegeneratingCoverLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState<any>()
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [jobDetails, setJobDetails] = useState<JobDetailsWithAnalysis[]>()
  const [currentCustomTemplateName, setCurrentCustomTemplateName] = useState<string | null>(null)
  const [customTemplateOptions, setCustomTemplateOptions] = useState<CustomTemplateListItem[]>([])
  const [creatingCustomTemplate, setCreatingCustomTemplate] = useState(false)
  const [guestUsage, setGuestUsage] = useState<GuestUsageSnapshot | null>(null)
  const [customRegenerationPrompt, setCustomRegenerationPrompt] = useState<string>('')
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);
  const stylesRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const customPromptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const styleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customTemplateSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGuestResume = slug === 'guest-resume';
  const usesRemoteResume = Boolean(user && !isGuestResume);
  const createTemplatePlaceholder = `${(user?.name || 'username').toLowerCase().trim().replace(/\s+/g, '-') || 'username'}-resume`;
  const response = useJobDescriptions(user ? user.id : '', slug)
  const resumeResponse = useGetResume(isGuestResume ? "" : slug)

  const loadGuestUsage = useCallback(async () => {
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

  const refreshUsageState = useCallback(async () => {
    if (user) {
      await getSubscription(false);
      return;
    }

    await loadGuestUsage();
  }, [getSubscription, loadGuestUsage, user]);

  const hydrateFromCache = useCallback(() => {
    const cached = ResumeCache.get(slug);
    if (!cached?.data) return false;

    setResumeData(cached.data);
    setSelectedTemplate(cached.data.template ?? 'modern');
    const hasMinimum = !!(cached.data.profile?.fullname && cached.data.profile?.email);
    setStatus(hasMinimum ? 'ready' : 'incomplete');
    return true;
  }, [slug]);

  const loadLocalResume = useCallback(() => {
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
      if (customTemplateSaveTimerRef.current) {
        clearTimeout(customTemplateSaveTimerRef.current);
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
      const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
      if (menu && menuRef.current && target && !menuRef.current.contains(target)) {
        showMenu(false);
      }
      if (reports && reportsRef.current && target && !reportsRef.current.contains(target)) {
        showReports(false);
      }
      // On mobile, keep style/template drawers open during control interactions.
      if (!isMobileViewport && (showStyles || showTemplates) && stylesRef.current && target && !stylesRef.current.contains(target)) {
        setShowStyles(false);
        setShowTemplates(false);
      }
    };

    const handleScroll = () => {
      showMenu(false);
      // Keep style/template drawers open while users scroll and interact on mobile.
      // Closing them on every scroll makes accordion controls feel broken.
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

  const buildTemplateDraftPayload = useCallback((style: ResumeStyle, baseTemplateId: string, name: string) => {
    const { sectionOrder, ...styleTokens } = style;
    return {
      displayName: name,
      description: `Custom template created from ${baseTemplateId}`,
      layoutConfig: {
        columns: 'single',
        sectionOrder: sectionOrder || [],
        baseTemplateId,
      },
      styleTokens,
      sectionRules: {},
      previewMeta: {
        source: 'preview-customization',
      },
    };
  }, []);

  const buildCustomTemplateOptionId = useCallback((baseTemplateId: string, name: string) => {
    return `custom:${baseTemplateId}:${name}`;
  }, []);

  const parseCustomTemplateOptionId = useCallback((optionId: string) => {
    if (!optionId.startsWith('custom:')) return null;
    const parts = optionId.split(':');
    if (parts.length < 3) return null;
    const baseTemplateId = parts[1];
    const name = parts.slice(2).join(':');
    if (!baseTemplateId || !name) return null;
    return { baseTemplateId, name };
  }, []);

  const upsertCustomTemplateOption = useCallback((name: string, baseTemplateId: string) => {
    setCustomTemplateOptions((prev) => {
      const existingIndex = prev.findIndex((item) => item.name === name);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { name, baseTemplateId };
        return next;
      }
      return [...prev, { name, baseTemplateId }];
    });
  }, []);

  const scheduleCustomTemplateSave = useCallback((nextStyle: ResumeStyle, baseTemplateId: string) => {
    if (!user || !currentCustomTemplateName) return;

    if (customTemplateSaveTimerRef.current) {
      clearTimeout(customTemplateSaveTimerRef.current);
    }

    customTemplateSaveTimerRef.current = setTimeout(async () => {
      try {
        const payload = buildTemplateDraftPayload(nextStyle, baseTemplateId, currentCustomTemplateName);
        await fetch(`/api/templates/draft/${encodeURIComponent(currentCustomTemplateName)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.warn('Failed to auto-save custom template draft', error);
      }
    }, 450);
  }, [buildTemplateDraftPayload, currentCustomTemplateName, user]);

  const handleCreateOwnTemplate = useCallback(async (templateNameInput: string, baseTemplateIdInput?: string) => {
    if (!resumeData) return;

    if (!user) {
      showToast('Sign in to create your own template', 'warning', 2500);
      return;
    }

    const normalizedName = normalizeTemplateIdentifier(templateNameInput || '');
    const baseTemplateId = baseTemplateIdInput || selectedTemplate || 'modern';

    if (!normalizedName) {
      const resetData = {
        ...resumeData,
        styleConfig: DEFAULT_RESUME_STYLE,
      };
      setResumeData(resetData);
      ResumeCache.set(slug, resetData, true);
      scheduleStyleSave(resetData);
      setCurrentCustomTemplateName(null);
      showToast('No name entered. Applied default template style.', 'info', 2200);
      return;
    }

    setCreatingCustomTemplate(true);
    try {
      const styleToSave = {
        ...DEFAULT_RESUME_STYLE,
        ...(resumeData.styleConfig || {}),
      } as ResumeStyle;
      const payload = {
        name: normalizedName,
        ...buildTemplateDraftPayload(styleToSave, baseTemplateId, normalizedName),
      };

      const response = await fetch('/api/templates/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        showToast(body?.error || 'Failed to create custom template', 'error', 3000);
        return;
      }

      setCurrentCustomTemplateName(normalizedName);
      setSelectedTemplate(baseTemplateId);
      const updatedResume = {
        ...resumeData,
        template: baseTemplateId,
        customTemplateName: normalizedName,
        customTemplateVersion: 1,
      };
      setResumeData(updatedResume);
      upsertCustomTemplateOption(normalizedName, baseTemplateId);
      ResumeCache.set(slug, updatedResume, true);
      await ResumeService.save(user.id, slug, baseTemplateId, updatedResume);
      ResumeCache.markSynced(slug);

      showToast('Custom template created. Built-in templates remain unchanged.', 'success', 2500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create custom template', 'error', 3000);
    } finally {
      setCreatingCustomTemplate(false);
    }
  }, [buildTemplateDraftPayload, resumeData, scheduleCustomTemplateSave, selectedTemplate, showToast, slug, upsertCustomTemplateOption, user]);

  useEffect(() => {
    if (!resumeData?.customTemplateName) return;
    const baseTemplateId = resumeData.template || selectedTemplate || 'modern';
    upsertCustomTemplateOption(resumeData.customTemplateName, baseTemplateId);
    setCurrentCustomTemplateName((prev) => prev ?? resumeData.customTemplateName ?? null);
  }, [resumeData?.customTemplateName, resumeData?.template, selectedTemplate, upsertCustomTemplateOption]);

  const handleTemplateChange = async (templateId: string) => {
    if (!resumeData) return;
    const parsedCustomTemplate = parseCustomTemplateOptionId(templateId);
    const nextTemplateId = parsedCustomTemplate?.baseTemplateId ?? templateId;

    if (parsedCustomTemplate) {
      setCurrentCustomTemplateName(parsedCustomTemplate.name);
      upsertCustomTemplateOption(parsedCustomTemplate.name, parsedCustomTemplate.baseTemplateId);
    } else {
      setCurrentCustomTemplateName(null);
    }

    setPendingUpdate(true);
    setSelectedTemplate(nextTemplateId);

    // Update cache immediately (optimistic update)
    const updatedData = {
      ...resumeData,
      template: nextTemplateId,
      customTemplateName: parsedCustomTemplate?.name || undefined,
    };
    ResumeCache.set(slug, updatedData, true);

    if (typeof window !== 'undefined' && user) {
      try {
        await ResumeService.save(user.id, slug, nextTemplateId, updatedData);
        ResumeCache.markSynced(slug);
        trackAnalyticsEvent(ANALYTICS_EVENTS.RESUME_SAVE, {
          source: 'template_change',
          resume_id: slug,
        });
        const styleToSave = {
          ...DEFAULT_RESUME_STYLE,
          ...(updatedData.styleConfig || {}),
        } as ResumeStyle;
        scheduleCustomTemplateSave(styleToSave, nextTemplateId);
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
      scheduleCustomTemplateSave(updatedData.styleConfig as ResumeStyle, selectedTemplate);
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
    try {
      const response = await fetch('/api/download/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeData: dataToUse,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const rawBody = await response.text().catch(() => '');
        let errorData: Record<string, unknown> = {};

        if (rawBody) {
          try {
            const parsed = JSON.parse(rawBody);
            if (parsed && typeof parsed === 'object') {
              errorData = parsed as Record<string, unknown>;
            }
          } catch {
            errorData = { rawBody };
          }
        }

        const details = typeof errorData.details === 'string' ? errorData.details : '';
        const errorText = typeof errorData.error === 'string' ? errorData.error : '';
        const fallbackMessage = `PDF generation failed (${response.status} ${response.statusText || 'Error'})`;
        const toastMessage = details || errorText || fallbackMessage;

        console.error('PDF generation error:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          ...errorData,
        });

        showToast(toastMessage, 'error', 3500);
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
      console.error('PDF download error:', error);
      showToast('Error generating PDF. Please try again.', 'error', 3000);
    } finally {
      setDownloading(false);
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

  const handleRegerate = async (resumeData: ResumeData, analysis?: AnalysisResult, jobDescription?: any, customPrompt?: string) => {
    setRegenerating(true);
    setPendingUpdate(true);
    showToast('Generating resume')
    try {
      const response = await ResumeService.regenerate(resumeData, jobDescription, analysis, customPrompt);
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
      setCustomRegenerationPrompt('');
      if (customPromptInputRef.current) {
        customPromptInputRef.current.style.height = 'auto';
      }
      trackAnalyticsEvent(ANALYTICS_EVENTS.RESUME_SAVE, {
        source: 'ai_regeneration',
        resume_id: slug,
      });
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

  const handleAnalyzeJD = async (jd: JobDetailsWithAnalysis) => {
    setAnalyzing(true);
    try {
      const resp = await analyzeResume({ resumeId: slug, jobDescriptionId: jd.id });
      if (!resp.ok) { return; }
      const data = resp.data;
      if (data && data.id) {
        const parsed = typeof data.result === 'string' && data.result ? JSON.parse(data.result) : data.result || {};
        const newAnalysis = {
          ...parsed,
          _analysisId: data.id,
          _jobDescriptionId: data.jobDescriptionId || jd.id,
          _analysedDate: data.updatedAt,
          _company: jd.company,
          _title: jd.title,
          _url: jd.url,
          _jobCreatedDate: jd.cretedAt,
        };
        setAnalysisData((prev: any[]) => [...(prev || []), newAnalysis]);
        showToast('Analysis complete', 'success', 1500);
        await getSubscription(false);
      }
    } catch (err) {
      console.warn('Fresh analysis failed:', err);
      showToast('Analysis failed. Please try again.', 'error', 3000);
    } finally {
      setAnalyzing(false);
    }
  };

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
      <div className="w-full min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="w-full max-w-5xl grid gap-8">
          <div className="h-10 w-64 rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 animate-pulse"
              />
            ))}
          </div>
          <div className="h-[70vh] w-full rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_12px,#eee_12px,#eee_24px)] dark:bg-[repeating-linear-gradient(45deg,#0f172a,#0f172a_12px,#1e293b_12px,#1e293b_24px)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#f8fafc_30%,#ffffff_70%)] dark:bg-[radial-gradient(circle_at_top,#0f172a_0%,#0b1220_35%,#020617_100%)] flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center p-6 max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">Incomplete Resume</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Please complete at least your name and email before previewing.
          </p>
          <Button
            variant="secondary"
            size="small"
            onClick={() => (window.location.href = `/builder/resumes/${slug}`)}
          >
            Continue Editing
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'ready' && resumeData) {
    const builtInTemplates = user ? Templates : Templates.slice(0, 3);
    const customTemplateDisplay = customTemplateOptions.map((item) => ({
      id: buildCustomTemplateOptionId(item.baseTemplateId, item.name),
      name: `${item.name} (Custom)`,
    }));
    const displayTemplate = [...builtInTemplates, ...customTemplateDisplay];
    const activeTemplateOptionId = currentCustomTemplateName
      ? buildCustomTemplateOptionId(selectedTemplate, currentCustomTemplateName)
      : selectedTemplate;
    const actionButtonBase = 'h-10 px-4 rounded-xl border text-[13px] font-semibold shadow-sm transition-all duration-200 inline-flex items-center gap-2';
    const actionGroupBase = 'flex items-center gap-2 flex-wrap';
    const actionDivider = 'hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700';
    return (
      <div
        className={`relative min-h-[100svh] pb-28 md:pb-8 bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#f8fafc_30%,#ffffff_70%)] dark:bg-[radial-gradient(circle_at_top,#0f172a_0%,#0b1220_35%,#020617_100%)] transition-all duration-300 ${fadeOut ? 'opacity-0 scale-[0.985]' : ''}`}
      >
        <div ref={topBarRef} className='md:hidden fixed inset-x-0 bottom-0 z-[100] pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between'>
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
            <div onClick={(e) => e.stopPropagation()} className='w-full max-h-[70vh] md:max-h-[70vh] overflow-auto absolute bottom-0 pb-12 z-10'>
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
                jobDetails={jobDetails}
                handleAnalyzeJD={handleAnalyzeJD}
                />
              </div>
            // </div>
          )}

          {showTemplates && resumeData && <div onClick={(e) => e.stopPropagation()} className='w-full absolute bottom-12 p-4 panel-from-center'>
            <StylePanel
              resumeData={resumeData}
              templateId={activeTemplateOptionId}
              handleStyleChange={handleStyleChange}
              stylesRef={stylesRef}
              templateOptions={displayTemplate}
              baseTemplateOptions={builtInTemplates}
              defaultCreateBaseTemplateId={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              onCreateTemplate={handleCreateOwnTemplate}
              createTemplatePlaceholder={createTemplatePlaceholder}
              creatingTemplate={creatingCustomTemplate}
              customTemplateName={currentCustomTemplateName}
              userSignedIn={Boolean(user)}
            />
          </div>}

          {showStyles && resumeData && <div onClick={(e) => e.stopPropagation()} className='w-full absolute bottom-12 p-4 panel-from-center'>
            <StylePanel
              resumeData={resumeData}
              templateId={activeTemplateOptionId}
              handleStyleChange={handleStyleChange}
              stylesRef={stylesRef}
              templateOptions={displayTemplate}
              baseTemplateOptions={builtInTemplates}
              defaultCreateBaseTemplateId={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              onCreateTemplate={handleCreateOwnTemplate}
              createTemplatePlaceholder={createTemplatePlaceholder}
              creatingTemplate={creatingCustomTemplate}
              customTemplateName={currentCustomTemplateName}
              userSignedIn={Boolean(user)}
            />
          </div>}

          {menu && <div onClick={(e) => e.stopPropagation()} className='w-full absolute bottom-12 p-4 panel-from-right'>
            <MenuPanel
              menu={menu}
              setShowConfirm={setShowConfirm}
              slug={slug}
              menuRef={menuRef}
            />
          </div>}
        </div>
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 grid gap-4 pt-3">
          {/* Actions */}
          <div className="hidden md:flex w-full sticky top-3 z-30 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md p-2.5 max-sm:justify-between justify-center gap-2 gap-y-2 min-[500px]:flex-wrap">
            <div className={actionGroupBase}>
              <button
                onClick={handleDownloadPDF}
                disabled={deleting || downloading || generating}
                className={`max-[500px]:w-full ${actionButtonBase} border-transparent bg-sky-600 text-white ${deleting || downloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-700 hover:-translate-y-0.5'}`}
              >
                <Download size={16} /> {downloading ? 'Preparing PDF...' : 'Download'}
              </button>
            </div>

            <div className={actionDivider} />

            <div className={actionGroupBase}>
              <button
                onClick={() => (window.location.href = `/builder/resumes/${slug}`)}
                className={`max-[500px]:hidden ${actionButtonBase} border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700`}
              >
                <Edit size={16} /> Edit Resume
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
                className={`max-[500px]:hidden ${actionButtonBase} border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ${deleting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-100 dark:hover:bg-red-900/50'}`}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}{' '}
                {deleting ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="md:hidden w-full grid grid-cols-1 gap-2 sticky top-3 z-30 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md p-2">
            <button
              onClick={handleDownloadPDF}
              disabled={deleting || downloading || generating}
              className={`h-11 w-full rounded-xl border border-transparent bg-sky-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 ${deleting || downloading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99] hover:bg-sky-700'}`}
            >
              <Download size={16} /> {downloading ? 'Preparing PDF...' : 'Download'}
            </button>
          </div>

          {!user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {guestUsage
                ? `Guest daily limits: ${guestUsage.download.remaining}/${guestUsage.download.limit} downloads left, ${guestUsage.regen.remaining}/${guestUsage.regen.limit} regenerations left.`
                : 'Guest daily limits: 5 downloads and 5 regenerations.'}
            </div>
          )}

          {/* AI improvement composer */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900/85 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Improvement</span>
              </div>
              {selectedAnalysis ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-700/40 font-medium max-w-[180px] truncate">
                  <Search size={10} className="shrink-0" />
                  <span className="truncate">{selectedAnalysis._title || selectedAnalysis._company || 'Job selected'}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">No job selected</span>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-end rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/60 focus-within:border-emerald-400/40 transition-shadow">
                  <textarea
                    ref={customPromptInputRef}
                    value={customRegenerationPrompt}
                    onChange={(e) => setCustomRegenerationPrompt(e.target.value)}
                    onInput={(e) => {
                      const target = e.currentTarget;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                    }}
                    rows={1}
                    placeholder={selectedAnalysis ? `Tailor for ${selectedAnalysis._title || 'this role'}…` : 'Describe how you want this resume improved…'}
                    className="w-full min-h-[22px] max-h-40 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none leading-6"
                  />
                </div>
                <button
                  onClick={() => handleRegerate(resumeData, selectedAnalysis, undefined, customRegenerationPrompt.trim() || undefined)}
                  disabled={generating || downloading || deleting}
                  className={`h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${generating || downloading || deleting
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 shadow-sm'
                    }`}
                >
                  <Sparkles size={13} />
                  {generating ? 'Improving…' : 'Improve'}
                </button>
              </div>
            </div>
          </div>

          {coverLetter &&
            <Button disabled={generating || generatingCoverLetter} variant='secondary' className={`md:w-fit  ${generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => setShowCoverLetter(true)} ><FileSliders size={14} />Show Cover letter</Button>
          }

          <div
            className="relative w-full min-h-fit overflow-auto rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-[0_18px_45px_-30px_rgba(2,6,23,0.9)]"
            id="resumeViewport"
          >
            {/* Optional inner wrapper to constrain width / center */}
            <div className="w-full min-[800px]:grid-cols-[minmax(0,68%)_minmax(320px,32%)] grid items-start gap-3 p-3">
              <ResumePreview
                resumeData={resumeData}
                template={selectedTemplate}
                regenerating={generating}
                maxScale={0.88}
                pdfMatchMode={pdfMatchPreview}
                className="w-full"
              />
              <div className="hidden md:flex flex-col gap-3 w-full sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
                {/* Analysis Reports — shown first for immediate visibility */}
                {jobDetails && jobDetails.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden shrink-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Analysis Reports</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{analysisData?.length ?? 0} of {jobDetails.length} analysed</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDesktopAnalysis((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {showDesktopAnalysis ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {showDesktopAnalysis ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showDesktopAnalysis && (
                      <div className="p-3 space-y-3">
                        <div className="max-h-[240px] overflow-auto space-y-2 pr-0.5">
                          {analysisData && analysisData.length > 0 ? analysisData.map((analysis: any) => {
                            const isSelected = selectedAnalysis?._analysisId === analysis._analysisId;
                            const score = Math.max(0, Math.min(100, Math.round(Number(analysis.matchingPercentage ?? 0))));
                            const scoreColor = score >= 70 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30' : score >= 50 ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30';
                            return (
                              <div
                                key={analysis._analysisId}
                                onClick={() => setSelectedAnalysis(isSelected ? null : analysis)}
                                className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected ? 'border-teal-400 bg-teal-50/60 dark:bg-teal-900/20 ring-1 ring-teal-400/40' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{analysis._title || analysis.role || 'Analysis report'}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{analysis._company || analysis.company || 'Unknown company'}</div>
                                  </div>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${scoreColor}`}>{score}%</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleReAnalysis(analysis); }}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <Search size={11} /> {isSelected && analyzing ? 'Analysing…' : 'Re-analyse'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRegerate(resumeData, analysis); }}
                                    disabled={generating || generatingCoverLetter}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Sparkles size={11} /> {isSelected && generating ? 'Optimising…' : 'Optimise'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); generateCoverLetter(analysis); }}
                                    disabled={generating || generatingCoverLetter}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FileUser size={11} /> Cover Letter
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); deletAnalysisReport(analysis._analysisId); }}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <Trash size={11} /> Delete
                                  </button>
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="py-4 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">No reports yet. Add a job description below to get started.</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700">
                          <JobDescription resumeId={resumeData.id} hideAnalysis={true} hideInput={true} hideTitle={true} handleRegenerate={handleRegerate} resumeData={resumeData} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Style panel — below analysis */}
                <div className="w-full">
                  <StylePanel
                    resumeData={resumeData}
                    templateId={activeTemplateOptionId}
                    handleStyleChange={handleStyleChange}
                    templateOptions={displayTemplate}
                    baseTemplateOptions={builtInTemplates}
                    defaultCreateBaseTemplateId={selectedTemplate}
                    onTemplateChange={handleTemplateChange}
                    onCreateTemplate={handleCreateOwnTemplate}
                    createTemplatePlaceholder={createTemplatePlaceholder}
                    creatingTemplate={creatingCustomTemplate}
                    customTemplateName={currentCustomTemplateName}
                    userSignedIn={Boolean(user)}
                  />
                </div>

                {/* No-analysis prompt — shown when no job descriptions exist yet */}
                {(!jobDetails || jobDetails.length === 0) && (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 overflow-hidden shrink-0">
                    <div className="px-4 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                          <Search size={12} className="text-teal-600 dark:text-teal-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">ATS Analysis</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                        Paste a job URL or description to score your resume and get targeted improvements.
                      </p>
                      {!showDesktopJobForm ? (
                        <button
                          type="button"
                          onClick={() => setShowDesktopJobForm(true)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors font-medium"
                        >
                          <Search size={11} /> Add Job Description
                        </button>
                      ) : (
                        <div className="mt-1">
                          <JobDescription resumeId={resumeData.id} hideAnalysis={true} hideTitle={true} handleRegenerate={handleRegerate} resumeData={resumeData} />
                          <button
                            type="button"
                            onClick={() => setShowDesktopJobForm(false)}
                            className="mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
