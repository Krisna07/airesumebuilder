'use client';
import React, { useCallback, useEffect, useState } from 'react';
import UserInfoStep from './UserInfoStep';
import SkillsStep from './SkillsStep';
import ExperienceStep from './ExperienceStep';
import EducationStep from './EducationStep';
import CustomSectionBuilder from './CustomSection';
import { CustomSectionData, Education, Experience, Profile, ResumeData, skills } from '@/types/types';
import Button from '../UI/Button';
import FormLayout from './FomLayout';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';
import { LocalResumeService } from '@/services/localResumeService';
import Templates from '../Templates/templates';
import ResumePreview from '../Templates/ResumePreview';
import JobDescription from './JobDescription';
import { useSaveResume } from '@/hooks/useResume';

interface MultiStepFormProps {
  resumeContent: ResumeData;
  resumeId: string;
  userId?: string;
}

const stepsLabels = [
  'Profile',
  'Skill',
  'Experience',
  'Education',
  'Custom Sections',
  'Job Description',
  'Template'
];

const FINAL_STEP_INDEX = stepsLabels.length + 1; // 8 (pre-preview confirmation)

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  resumeContent,
  resumeId,
  userId
}) => {
  const [formData, setFormData] = useState<ResumeData>(resumeContent);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(resumeContent?.template);
  const [currentStep, setCurrentStep] = useState(1);
  const { showToast } = useToast();

  const displayTemplate = userId ? Templates : Templates.slice(0, 3);

  const saveResume = useSaveResume(userId, resumeId, selectedTemplate, formData)
  const persist = useCallback(async () => {
    if (userId) {
      saveResume.mutateAsync()
      if (saveResume.isError) {
        showToast(saveResume.error.message, 'error', 3000);
        return false;
      }
    } else {
      await LocalResumeService.update(resumeId, formData);
    }
    return true;
  }, [userId, resumeId, formData, showToast, saveResume]);


  const handleNext = useCallback(async () => {
    const ok = await persist();
    if (!ok) return;
    if (currentStep === stepsLabels.length) {
      window.location.href = `/builder/${resumeId}/preview`;
      return;
    }
    setCurrentStep(s => Math.min(s + 1, FINAL_STEP_INDEX));
  }, [persist, currentStep, resumeId]);

  const handlePrevious = useCallback(async () => {
    await persist();
    setCurrentStep(s => Math.max(s - 1, 1));
  }, [persist]);

  const handleSaveDraft = async () => {
    const ok = await persist();
    if (ok) showToast('Draft saved successfully!', 'success');
  };

  // Keyboard arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < stepsLabels.length) handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 1) handlePrevious();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep, handleNext, handlePrevious]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormLayout
            heading="Let's start with your details"
            subheading="Provide essential information to proceed."
          >
            <UserInfoStep
              data={formData?.profile}
              onChange={(data: Profile) =>
                setFormData({ ...formData, profile: data })
              }
            />
          </FormLayout>
        );
      case 2:
        return (
          <FormLayout
            heading="Let's add your skills"
            subheading="List and group your core skills."
          >
            <SkillsStep
              data={formData.skills}
              updateSkills={(data: skills[]) =>
                setFormData({ ...formData, skills: data })
              }
            />
          </FormLayout>
        );
      case 3:
        return (
          <FormLayout
            heading="Add your experience"
            subheading="Detail your professional work history."
          >
            <ExperienceStep
              data={formData.experiences}
              onChange={(data: Experience[]) =>
                setFormData({ ...formData, experiences: data })
              }
            />
          </FormLayout>
        );
      case 4:
        return (
          <FormLayout
            heading="Add your education"
            subheading="Provide your academic qualifications."
          >
            <EducationStep
              data={formData.educations}
              onChange={(data: Education[]) =>
                setFormData({ ...formData, educations: data })
              }
            />
          </FormLayout>
        );
      case 5:
        return (
          <FormLayout
            heading="Add custom sections"
            subheading="Add projects, awards, publications, certifications, or any other relevant sections."
          >
            <CustomSectionBuilder
              data={formData.customSections}
              onChange={(data: CustomSectionData[]) =>
                setFormData({ ...formData, customSections: data })
              }
            />
          </FormLayout>
        );

      case 6:
        return (
          <FormLayout
            heading="Add job description"
            subheading="Provide detailed responsibilities and achievements."
          >
            <JobDescription
              resumeId={resumeId}
              disabled={userId ? false : true}
            />
          </FormLayout>
        );
      case 7:
        return (
          <FormLayout
            heading="Choose your template"
            subheading="Select a design style for your resume."
          >
            <div className="w-full">
              <div className="grid  md:grid-cols-3 min-[500px]:grid-cols-2 gap-4">
                {displayTemplate.map(template => {
                  const active = selectedTemplate === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full group p-2 rounded-lg border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative
                        ${active
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'}`}
                      aria-pressed={active}
                    >
                      <div
                        className={`rounded-md overflow-hidden mb-3 bg-linear-to-tr ${template.accent} relative aspect-3/4`}
                      >
                        <div className=" absolute inset-0">
                          <ResumePreview
                            template={template.id}
                            resumeData={resumeContent}
                          />
                        </div>
                      </div>
                      <h3
                        className={`font-semibold mb-1 ${active ? 'text-blue-700' : 'text-gray-800'
                          }`}
                      >
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug">
                        {template.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </FormLayout>
        );
      case 8:
        return (
          <div className="w-full max-w-lg mx-auto py-10 px-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Ready to preview
              </h3>
              <p className="text-sm text-gray-600">
                Your resume is ready. Continue to preview and download.
              </p>
            </div>
          </div>
        );
      default:
        return <div className="p-4">Invalid step</div>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-start bg-green-500  overflow-hidden">
      {currentStep !== FINAL_STEP_INDEX && (
        <div
          className="shrink-0 w-full flex items-center gap-3 bg-white/95 backdrop-blur-sm  sticky z-40 px-3 py-2 overflow-x-auto md:justify-center"
          role="tablist"
          aria-label="Form steps"
        >
          {stepsLabels.map((label, i) => {
            const stepIndex = i + 1;
            const active = stepIndex === currentStep;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCurrentStep(stepIndex)}
                role="tab"
                aria-selected={active}
                aria-controls={`step-panel-${stepIndex}`}
                className={`flex items-center gap-2 shrink-0 p-1 ${active ? 'pr-2' : ''} min-[800px]:pr-2 rounded-full text-xs md:text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active
                  ? 'bg-gray-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span
                  className={`w-5 h-5 grid place-items-center rounded-full text-[11px] ${active ? 'bg-white text-blue-600' : 'bg-black/10'
                    }`}
                >
                  {stepIndex}
                </span>
                <span className={`max-[800px]:${active ? 'block' : 'hidden'} block `}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Single scroll region */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 sm:px-4 mb-8 scroll-smooth"
        id={`step-panel-${currentStep}`}
        role="tabpanel"
        aria-labelledby={`step-${currentStep}`}
        style={{ WebkitOverflowScrolling: 'touch' }}>
        {renderStep()}
        <div className="h-6" />
      </div>

      {currentStep !== FINAL_STEP_INDEX && (
        <div className="shrink-0 w-full fixed bottom-0 z-50 bg-white/95 backdrop-blur-sm shadow-[0_0_2px_0_gray]">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex-1">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handlePrevious}
                  aria-label="Previous step">
                  <FaChevronLeft />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStep < stepsLabels.length && (
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handleSaveDraft}
                  aria-label="Save draft"
                >
                  Save Draft
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
                {currentStep === stepsLabels.length ? 'Preview Resume' : 'Next'}
                <FaChevronRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepForm;
