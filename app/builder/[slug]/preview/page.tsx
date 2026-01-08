/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { JobDetailsWithAnalysis, ResumeData } from '@/types/types';
import ResumePreview from '@/components/Templates/ResumePreview';
import { useAuth } from '@/context/authContext';
import { analyzeResume, ResumeService } from '@/services/resumeServices';
import { Bot, Download, Edit, Plus, Trash, Loader2, SettingsIcon, BarChart2Icon, BotIcon, BookTemplateIcon, X, FileUser, FileSliders } from 'lucide-react';
import { useToast } from '@/context/PopupContext';
import Button from '@/components/UI/Button';
import ConfirmDialog from '@/components/UI/ConfirmDialog';
import Templates from '@/components/Templates/templates';
import JobAnalysisReport from '@/components/UI/JobAnalysisReport';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import ReportsPanel from './ReportsPanel';
import TemplatesPanel from './TemplatesPanel';
import MenuPanel from './MenuPanel';
import JobDescription from '@/components/Forms/JobDescription';
import { useJobDescriptions } from '@/hooks/useJobDescriptions';
import { useGetResume } from '@/hooks/useResume';


const sanitizeFile = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '');

const PreviewPage = () => {
  const params = useParams();
  const slug = (params?.slug ?? "") as string;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [status, setStatus] = useState<'loading' | 'ready' | 'incomplete' | 'not-found' | 'error'>('loading');; // delay gate for not-found
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
  const [generatingCoverLetter, setRegeneratingCoverLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState<any>()
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);
  const templatesRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);

  const response = useJobDescriptions(user ? user.id : '', slug)
  const resumeResponse = useGetResume(slug)

  const loadLocalResume = React.useCallback(() => {
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
  }, [slug]);

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
  }, [resumeResponse.isFetched, resumeResponse.isError, resumeResponse.isSuccess, resumeResponse.data?.id, user, loadLocalResume, showToast])

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
      if (showTemplates && templatesRef.current && target && !templatesRef.current.contains(target)) {
        setShowTemplates(false);
      }
    };

    const handleScroll = () => {
      showMenu(false);
      setShowTemplates(false);

    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [menu, reports, showTemplates, showToast]);


  // Process job descriptions when the query completes successfully
  useEffect(() => {
    if (!response || !response.isSuccess || !response.data) return;
    const data: JobDetailsWithAnalysis[] = response.data.data || [];
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
        setRegenerating(false)
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
      setRegenerating(false)
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showToast('Error generating PDF. Please try again.', 'error', 3000);
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

  const handleRegerate = async (resumeData: ResumeData, analysis?: any, jobDescription?: any) => {
    if (!user) {
      return showToast('This feature is not availbale on guest version', 'info', 3000);
    }
    setRegenerating(true);
    setPendingUpdate(true);
    showToast('Generating resume')
    const response = await ResumeService.regenerate(resumeData, analysis || jobDescription);
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

  const handleReAnalysis = async (analysis: any) => {
    setAnalyzing(true)
    const resumeId = slug
    const jobDescriptionId = analysis._jobDescriptionId
    const response = await analyzeResume({
      resumeId,
      jobDescriptionId
    })
    if (!response.ok) {
      console.log(response)
      setAnalyzing(false)
    }
    const data = response.data
    try {
      // response.data should contain the updated analysis record with fields like id and result
      if (data && data.id) {
        const refreshed = typeof data.result === 'string' && data.result ? JSON.parse(data.result) : data.result || {};
        setAnalysisData((prev: any[] | undefined) => (prev || []).map((a: any) => ((a as any)._analysisId === data.id) ? ({ ...(refreshed as any), _analysisId: data.id, _jobDescriptionId: data.jobDescriptionId, _analysedDate: data.updatedAt }) : a));
        showToast('Analysis updated', 'success', 1500);
      }
    } catch (err) {
      console.warn('Failed to merge refreshed analysis:', err, data);
    } finally {
      setAnalyzing(false);
    }
  }

  const generateCoverLetter = async (analysis: any) => {
    setRegeneratingCoverLetter(true)
    if (!slug) {
      showToast('No resume selected to generate coverletter', 'error', 3000)
      setRegeneratingCoverLetter(false)
    }
    const jobDescriptionId = analysis._jobDescriptionId
    const resumeId = slug
    if (jobDescriptionId && slug) {
      console.log('Generatig with', jobDescriptionId, resumeId)
      const response = await fetch('/api/ai/generate-coverletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeId,
          jobDescriptionId: jobDescriptionId,
          analysis: analysis || undefined
        }),
      })

      if (!response.ok) {
        setRegeneratingCoverLetter(false)
        showToast('Error generating coverletter', 'error', 3000)
        setShowCoverLetter(false)
        return
      }

      const data = await response.json()
      console.log(data)
      setCoverLetter(data.data)
      setShowCoverLetter(true)
      localStorage.setItem('coverLetter', JSON.stringify(data.data))
      setRegeneratingCoverLetter(false)
    }
  }

  // Unified rendering logic to prevent 'No Resume Data' flash
  if (resumeResponse.isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid gap-8">
          <div className="h-10 w-64 rounded-md bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 animate-pulse"
              />
            ))}
          </div>
          <div className="h-[70vh] w-full rounded-2xl border border-dashed border-gray-300 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_12px,#eee_12px,#eee_24px)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (resumeResponse.isSuccess && status === 'incomplete') {
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

  if (resumeResponse.isFetched && resumeResponse.isSuccess && resumeData) {
    const displayTemplate = user ? Templates : Templates.slice(0, 3);
    return (
      <div
        className={`relative  transition-all duration-300 ${fadeOut ? 'opacity-0 scale-[0.985]' : ''}`}
      >
        <div ref={topBarRef} className=' min-[500px]:hidden w-full fixed z-100 bottom-0  flex items-center  justify-between'>
          <div className='w-full flex items-start justify-between bg-white p-4'>
            <BarChart2Icon onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {
              e.stopPropagation();
              showMenu(false);
              setShowTemplates(false);
              showReports(!reports);
            }} className={`${reports ? 'text-blue-600  scale-105' : ''} transition-all ease-in-out  w-fit`} />

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
          </div>

          {reports && (
            <div className='w-full absolute bottom-12 grid place-items-start bg-white p-4 panel-from-left'>
              <div className='w-full max-h-[60vh] md:max-h-[70vh] overflow-auto'>
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
            </div>
          )}

          {showTemplates && <div className='w-full absolute bottom-12 bg-white p-4 panel-from-center'>
            <TemplatesPanel
              displayTemplate={displayTemplate}
              selectedTemplate={selectedTemplate}
              handleTemplateChange={handleTemplateChange}
              user={user}
              templatesRef={templatesRef}
            />
          </div>}
          {menu && <div className='w-full absolute bottom-12 bg-white p-4 panel-from-right'>
            <MenuPanel
              menu={menu}
              setShowConfirm={setShowConfirm}
              slug={slug}
              menuRef={menuRef}
            />
          </div>}
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 mt-2">
          {/* Actions */}
          <div className="w-full flex max-sm:justify-between justify-center  gap-1 gap-y-2 md:gap-3 min-[500px]:flex-wrap text-[14px]">
            <button
              onClick={handleDownloadPDF}
              disabled={deleting || downlaoding || generating}
              className={`max-[500px]:w-full px-4 py-1 bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${deleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
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
          </div>
          {coverLetter &&
            <Button disabled={generating || generatingCoverLetter} variant='secondary' className={`md:w-fit  ${generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => setShowCoverLetter(true)} ><FileSliders size={14} />Show Cover letter</Button>
          }
          {analysisData && analysisData?.length > 0 &&
            <div className='max-[500px]:hidden flex gap-4 w-full rounded shadow-[0_0_2px_0_gray] p-4'>
              <div className='w-full'>
                <h3 className='font-semibold px-2'>Analysis</h3>
                <div className='w-full flex flex-wrap items-start justify-between'>
                  {analysisData && analysisData.map((analysis: any, count: number) => {
                    const isSelected = selectedAnalysis?._analysisId === (analysis as any)._analysisId;
                    return <div onClick={() => setSelectedAnalysis(analysis)} key={count} className={` max-w-[48%] h-fit p-2 grid gap-2 items-center  m-1  relative ${isSelected ? 'ring-2 ring-blue-300/50 rounded-2xl' : ''} ${isSelected && (generatingCoverLetter || generating) ? 'animate-pulse' : ''}`}>
                      <JobAnalysisReport {...analysis} />
                      <div className='md:flex grid items-center gap-2'>
                        <Button variant='secondary' size='small' className='md:w-fit w-full' onClick={() => handleReAnalysis(analysis)}><FaMagnifyingGlass /> {isSelected && analyzing ? 'Analysing' : 'Re-Analyse'}</Button>
                        <Button disabled={generating || generatingCoverLetter} variant='primary' className={`md:w-fit w-full ${isSelected && (generatingCoverLetter || generating) ? 'animate-pulse' : ''}`} size='small' onClick={() => handleRegerate(resumeData, analysis)} ><BotIcon size={14} />{isSelected && generating ? 'Optimising Resume' : 'Optimise Resume'}</Button>
                        <Button disabled={generating || generatingCoverLetter} variant='secondary' className={`md:w-fit w-full ${isSelected && generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => generateCoverLetter(analysis)} ><FileUser size={14} />{isSelected && generatingCoverLetter ? 'Generating Cover Letter' : 'Generate Cover Letter'}</Button>
                      </div>
                    </div>
                  })
                  }
                  <div className={analysisData.length % 2 == 0 ? 'w-full' : 'w-[48%]'}>
                    <JobDescription resumeId={resumeData.id} hideAnalysis={true} hideInput={true} hideTitle={true} handleRegenerate={handleRegerate} resumeData={resumeData} />
                  </div>
                </div>
              </div>


            </div>
          }
          <div
            className="relative w-full min-h-fit overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm"
            id="resumeViewport"
          >
            {/* Optional inner wrapper to constrain width / center */}
            <div className="w-full min-[800px]:grid-cols-[80%_20%] grid items-start gap-2 ">
              <div className="max-[800px]:flex max-[500px]:hidden hidden w-fit space-y-2 ">
                <div className="w-full px-4  gap-4 ">
                  <div className='font-bold py-2'>Preview Template</div>
                  <div className='flex gap-2'>
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
                          <h3
                            className={`text-[14px]  ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}
                          >
                            {template.name}
                          </h3>
                        </div>
                      </button>
                    ))}</div>
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
              <ResumePreview
                resumeData={resumeData}
                template={selectedTemplate}
                regenerating={generating}
              />
              <div className="max-[800px]:hidden max-[500px]:hidden max-w-fit space-y-2 ">
                <div className="w-full grid  gap-4 ">
                  <div className='font-bold py-2'>Preview Template</div>
                  <div className='grid min-[1000px]:grid-cols-2 gap-2'>
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
                          <h3
                            className={`text-[14px]  ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}
                          >
                            {template.name}
                          </h3>
                        </div>
                      </button>
                    ))}</div>
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
                  }} className="ml-2 px-3 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200"
                >
                  Copy
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
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Download
                </button>
              </div>

              <div id="coverletter">
                <header className="flex flex-col  items-start justify-between gap-4 p-6 ">
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

  if (resumeResponse.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Resume</h2>
          <p className="text-gray-600 mb-6">An unexpected error occurred. Redirecting…</p>
        </div>
      </div>
    );
  }
  if (status === 'not-found') {
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
  // Should not reach here; keep skeleton as fallback
  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid gap-8">
        <div className="h-10 w-64 rounded-md bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-[70vh] w-full rounded-2xl border border-dashed border-gray-300 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_12px,#eee_12px,#eee_24px)] animate-pulse" />
      </div>
    </div>
  );
};

export default PreviewPage;
