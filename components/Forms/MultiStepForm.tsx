"use client"
import type React from "react"
import { useCallback, useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserInfoStep from "./UserInfoStep"
import SkillsStep from "./SkillsStep"
import ExperienceStep from "./ExperienceStep"
import EducationStep from "./EducationStep"
import CustomSectionBuilder from "./CustomSection"
import type { CustomSectionData, Education, Experience, Profile, ResumeData, skills } from "@/types/types"
import Button from "../Ui/Button"
import FormLayout from "./FomLayout"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useToast } from "@/context/PopupContext"
import Templates from "../Templates/templates"
import ResumePreview from "../Templates/ResumePreview"
import JobDescription from "./JobDescription"
import { useResumeSync } from "@/hooks/useResumeSync"
import { ResumeCache } from "@/lib/resumeCache"
import { SyncIndicator } from "../Ui/SyncIndicator"

interface MultiStepFormProps {
  resumeContent: ResumeData
  resumeId: string
  userId?: string
}

const STEPS_LABELS = [
  "Profile",
  "Skills",
  "Experience",
  "Education",
  "Custom Sections",
  "Job Description",
  "Template",
] as const

const FINAL_STEP_INDEX = STEPS_LABELS.length + 1

const MultiStepForm: React.FC<MultiStepFormProps> = ({ resumeContent, resumeId, userId }) => {
  const router = useRouter()
  const [formData, setFormData] = useState<ResumeData>(() => {
    // Load from cache first for instant UI
    const cached = ResumeCache.get(resumeId);
    return cached?.data ?? resumeContent;
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    const cached = ResumeCache.get(resumeId);
    return cached?.data.template ?? resumeContent?.template ?? "";
  })
  const [currentStep, setCurrentStep] = useState(1)
  const { showToast } = useToast()

  const displayTemplates = useMemo(() => (userId ? Templates : Templates.slice(0, 3)), [userId])

  // Background sync hook
  const { syncStatus, lastSyncTime, queueSync, syncNow } = useResumeSync({
    resumeId,
    userId,
    template: selectedTemplate,
    debounceMs: 3000,
    onSyncError: (error) => {
      showToast(error.message || "Failed to save changes", "error", 3000);
    },
  });

  // Sync formData changes to cache and queue background sync
  useEffect(() => {
    const dataWithTemplate = { ...formData, template: selectedTemplate };
    queueSync(dataWithTemplate);
  }, [formData, selectedTemplate, queueSync]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (ResumeCache.isDirty(resumeId)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [resumeId]);

  const handleNext = useCallback(async () => {
    if (currentStep === STEPS_LABELS.length) {
      // Force sync before navigating to preview
      const dataWithTemplate = { ...formData, template: selectedTemplate };
      await syncNow(dataWithTemplate);
      router.push(`/builder/${resumeId}/preview`)
      return
    }
    setCurrentStep((s) => Math.min(s + 1, FINAL_STEP_INDEX))
  }, [currentStep, resumeId, router, formData, selectedTemplate, syncNow])

  const handlePrevious = useCallback(async () => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }, [])

  const handleSaveDraft = useCallback(async () => {
    const dataWithTemplate = { ...formData, template: selectedTemplate };
    const ok = await syncNow(dataWithTemplate);
    if (ok) showToast("Draft saved successfully!", "success", 3000);
  }, [formData, selectedTemplate, syncNow, showToast])

  const updateProfile = useCallback((data: Profile) => {
    setFormData((prev) => ({ ...prev, profile: data }))
  }, [])

  const updateSkills = useCallback((data: skills[]) => {
    setFormData((prev) => ({ ...prev, skills: data }))
  }, [])

  const updateExperiences = useCallback((data: Experience[]) => {
    setFormData((prev) => ({ ...prev, experiences: data }))
  }, [])

  const updateEducations = useCallback((data: Education[]) => {
    setFormData((prev) => ({ ...prev, educations: data }))
  }, [])

  const updateCustomSections = useCallback((data: CustomSectionData[]) => {
    setFormData((prev) => ({ ...prev, customSections: data }))
  }, [])

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <FormLayout heading="Let's start with your details" subheading="Provide essential information to proceed.">
            <UserInfoStep data={formData?.profile} onChange={updateProfile} />
          </FormLayout>
        )
      case 2:
        return (
          <FormLayout heading="Let's add your skills" subheading="List and group your core skills.">
            <SkillsStep data={formData.skills} updateSkills={updateSkills} />
          </FormLayout>
        )
      case 3:
        return (
          <FormLayout heading="Add your experience" subheading="Detail your professional work history.">
            <ExperienceStep data={formData.experiences} onChange={updateExperiences} />
          </FormLayout>
        )
      case 4:
        return (
          <FormLayout heading="Add your education" subheading="Provide your academic qualifications.">
            <EducationStep data={formData.educations} onChange={updateEducations} />
          </FormLayout>
        )
      case 5:
        return (
          <FormLayout heading="Add custom sections" subheading="Add projects, awards, publications, or certifications.">
            <CustomSectionBuilder data={formData.customSections} onChange={updateCustomSections} />
          </FormLayout>
        )
      case 6:
        return (
          <FormLayout heading="Add job description" subheading="Provide detailed responsibilities and achievements.">
            <JobDescription resumeId={resumeId} disabled={!userId} />
          </FormLayout>
        )
      case 7:
        return (
          <FormLayout heading="Choose your template" subheading="Select a design style for your resume.">
            <div className="w-full overflow-hidden">
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
                {displayTemplates.map((template) => {
                  const active = selectedTemplate === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`overflow-hidden group p-2 rounded-lg border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 relative
                        ${active
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600"
                        }`}
                      aria-pressed={active}
                    >

                      <div className={`w-full z-10 rounded-md overflow-hidden group-hover:bg-teal-400/25 ${active ? 'bg-teal-400/25' : ''} mb-3 relative`}>
                        <div className="w-full h-full  z-20 absolute"></div>
                        <ResumePreview template={template.id} resumeData={resumeContent} />
                      </div>
                      <h3
                        className={`font-semibold mb-1 ${active ? "text-teal-700 dark:text-teal-400" : "text-slate-800 dark:text-slate-200"}`}
                      >
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{template.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </FormLayout>
        )
      case 8:
        return (
          <div className="w-full max-w-lg mx-auto py-10 px-4">
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Ready to preview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your resume is ready. Continue to preview and download.
              </p>
            </div>
          </div>
        )
      default:
        return <div className="p-4">Invalid step</div>
    }
  }, [
    currentStep,
    formData,
    updateProfile,
    updateSkills,
    updateExperiences,
    updateEducations,
    updateCustomSections,
    displayTemplates,
    selectedTemplate,
    handleTemplateSelect,
    resumeId,
    userId,
    resumeContent,
  ])

  return (
    <div className="w-full h-full flex flex-col items-start bg-slate-50 dark:bg-slate-900 ">
      {/* Step indicators */}
      {currentStep !== FINAL_STEP_INDEX && (
        <div
          className="shrink-0 w-full hide-scrollbar sticky top-14 flex items-center justify-center max-[500px]:justify-start md:justify-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-40 px-3 py-2 overflow-x-auto  border-b border-slate-200 dark:border-slate-700"
          role="tablist"
          aria-label="Form steps"
        >
          {STEPS_LABELS.map((label, i) => {
            const stepIndex = i + 1
            const active = stepIndex === currentStep
            const completed = stepIndex < currentStep
            return (
              <button
                key={label}
                type="button"
                onClick={() => goToStep(stepIndex)}
                role="tab"
                aria-selected={active}
                aria-controls={`step-panel-${stepIndex}`}
                className={`flex items-center gap-2 shrink-0 p-1.5 ${active ? "pr-3" : ""} md:pr-3 rounded-full text-xs md:text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                  ${active
                    ? "bg-teal-600 text-white shadow-sm"
                    : completed
                      ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
              >
                <span
                  className={`w-5 h-5 grid place-items-center rounded-full text-[11px] font-medium
                    ${active
                      ? "bg-white text-teal-600"
                      : completed
                        ? "bg-teal-600 text-white"
                        : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                    }`}
                >
                  {completed ? <Check size={12} /> : stepIndex}
                </span>
                <span className={`${active ? "block" : "hidden"} md:block`}>{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content area */}
      <div
        className="flex-1  overscroll-contain px-2 sm:px-4 mb-20 scroll-smooth w-full"
        id={`step-panel-${currentStep}`}
        role="tabpanel"
        aria-labelledby={`step-${currentStep}`}
      >
        {renderStep}
        <div className="h-6" />
      </div>

      {/* Navigation footer */}
      {currentStep !== FINAL_STEP_INDEX && (
        <div className="shrink-0 w-full fixed bottom-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Sync Status */}
            <SyncIndicator status={syncStatus} lastSyncTime={lastSyncTime} className="hidden sm:block" />

            <div className="flex-1">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handlePrevious}
                  aria-label="Previous step"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStep < STEPS_LABELS.length && (
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={handleSaveDraft}
                  disabled={syncStatus === 'syncing'}
                  aria-label="Save draft"
                >
                  {syncStatus === 'syncing' ? "Saving..." : "Save Draft"}
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="small"
                onClick={handleNext}
                disabled={currentStep === FINAL_STEP_INDEX}
                aria-label="Next step"
              >
                {currentStep === STEPS_LABELS.length ? "Preview Resume" : "Next"}
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiStepForm
