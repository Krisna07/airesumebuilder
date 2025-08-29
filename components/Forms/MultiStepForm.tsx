'use client';
import React, { useState } from 'react';
import UserInfoStep from './UserInfoStep';
import SkillsStep from './SkillsStep';
import ExperienceStep from './ExperienceStep';
import EducationStep from './EducationStep';
import CertificatesStep from './CertificatesStep';
import { Certificates, Education, Experience, Profile, ResumeData, skills } from '@/types/types';
import Button from '../UI/Button';
import FormLayout from './FomLayout';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import JobDescription from './JobDescription';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';

interface MultiStepFormProps {
  resumeContent: ResumeData;
  resumeId: string;
  userId: string;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({ resumeContent, resumeId, userId }) => {
  const [formData, setFormData] = useState<ResumeData>(resumeContent);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(resumeContent?.template);
  const [currentStep, setCurrentStep] = useState(1);
  const toast = useToast();

  const handleNext = async () => {
    // Save current data and template before proceeding
    const res = await ResumeService.save(userId, resumeId, selectedTemplate, formData);
    if (res.error) {
      console.log(res.error);
      return;
    }
    if (currentStep === 7) {
      // Redirect to preview page with UUID
      window.location.href = `/builder/${resumeId}/preview`;
    } else {
      setCurrentStep((prevStep) => Math.min(prevStep + 1, 8));
    }
  };

  const handlePrevious = async () => {
    // Save current data and template before going back
    console.log(`saving data fromData`, formData, userId);

    await ResumeService.save(userId, resumeId, selectedTemplate, formData);
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const handleSaveDraft = async () => {
    console.log(`saving data fromData`, formData, userId);
    await ResumeService.save(userId, resumeId, selectedTemplate, formData);
    toast.showToast('Draft saved successfully!', 'success');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormLayout heading={"Let's start with your details"} subheading={'Provide essential information to proceed.'}>
            <UserInfoStep data={formData?.profile} onChange={(data: Profile) => setFormData({ ...formData, profile: data })} />
          </FormLayout>
        );
      case 2:
        return (
          <FormLayout heading={'Lets add your skills'} subheading={'Please list all your skills '}>
            <SkillsStep data={formData.skills} updateSkills={(data: skills[]) => setFormData({ ...formData, skills: data })} />
          </FormLayout>
        );
      case 3:
        return (
          <FormLayout heading={'Add your Experience'} subheading={'Provide your work experience'}>
            <ExperienceStep data={formData.experiences} onChange={(data: Experience[]) => setFormData({ ...formData, experiences: data })} />
          </FormLayout>
        );

      case 4:
        return (
          <FormLayout heading={'Add your Educations'} subheading={'Provide all your academic qualifications.'}>
            <EducationStep data={formData.educations} onChange={(data: Education[]) => setFormData({ ...formData, educations: data })} />
          </FormLayout>
        );
      case 5:
        return (
          <FormLayout heading={"Let's add your certificates"} subheading={'Provide your certifications.'}>
            <CertificatesStep data={formData.certificates} onChange={(data: Certificates[]) => setFormData({ ...formData, certificates: data })} />
          </FormLayout>
        );
      case 6:
        return (
          <FormLayout heading={"Let's add Job description"} subheading={'Provide detail job description with roles and responsibilities.'}>
            <JobDescription />
          </FormLayout>
        );
      case 7:
        return (
          <FormLayout heading={'Choose Your Template'} subheading={'Select a template style for your resume.'}>
            <div className='max-w-4xl mx-auto'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                {[
                  { id: 'modern' as const, name: 'Modern', desc: 'Clean design with gradient header', icon: '🎨' },
                  { id: 'classic' as const, name: 'Classic', desc: 'Traditional professional layout', icon: '📄' },
                  { id: 'minimal' as const, name: 'Minimal', desc: 'Simple, elegant design', icon: '✨' }
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedTemplate === template.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      <span className='text-2xl'>{template.icon}</span>
                      <h3 className={`font-semibold ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}>{template.name}</h3>
                    </div>
                    <p className='text-sm text-gray-600'>{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </FormLayout>
        );
      case 8:
        return (
          <div className='text-center py-8'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7'></path>
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Ready to Preview!</h3>
              <p className='text-gray-600 mb-4'>Your resume is ready. Click next to preview and download.</p>
            </div>
          </div>
        );
      default:
        return <div>Invalid Step</div>;
    }
  };
  const navigations = ['Profile', 'Skill', 'Experience', 'Education', 'Certificates', 'Job Description', 'Template'];
  return (
    <div className='w-full min-[800px]:h-full grid place-items-center transition-all ease-in-out duration-300 '>
      <div className='w-full grid gap-2 place-items-start p-2 box-border '>
        {currentStep != navigations.length + 1 && (
          <div className='w-full flex items-center justify-center gap-[12px]'>
            {navigations.map((item: string, index: number) => (
              <div
                onClick={() => setCurrentStep(index + 1)}
                key={index}
                className={`w-fit cursor-pointer  transition-all ease-in-out duration-300 flex items-center ${index + 1 === currentStep ? 'text-black' : 'text-black/50'} `}
              >
                <div
                  className={`min-w-[20px] h-[20px] m-[4px] grid place-items-center text-center transition-all ease-in-out duration-300 leading-[80%] text-sm rounded-full ${
                    index + 1 === currentStep ? 'bg-black text-white' : ' w-fit bg-white'
                  } `}
                >
                  {index + 1}
                </div>
                <span className={`${index + 1 === currentStep ? 'max-[800px]:block' : 'max-[800px]:hidden'}`}>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className='w-full  grid gap-2 place-items-center relative'>
          {renderStep()}
          {currentStep != navigations.length + 1 && (
            <div className='mt-6 gap-4 flex justify-between items-center'>
              {currentStep > 1 && (
                <Button type='button' variant='secondary' size='small' onClick={handlePrevious} disabled={currentStep === 1}>
                  <FaChevronLeft /> {currentStep === 7 ? 'Review' : 'Previous'}
                </Button>
              )}

              <div className='flex gap-2'>
                {/* Save Draft Button - available on all steps except completion */}
                {currentStep < 7 && (
                  <Button type='button' variant='secondary' size='small' onClick={handleSaveDraft}>
                    {'Save Draft'}
                  </Button>
                )}

                <Button type='button' variant='primary' size='small' onClick={handleNext} disabled={currentStep === 8}>
                  {currentStep === 7 ? 'Preview Resume' : 'Next'}
                  <FaChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
