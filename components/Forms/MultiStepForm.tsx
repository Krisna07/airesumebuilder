'use client';
import React, { useEffect, useState } from 'react';
import UserInfoStep from './UserInfoStep';
import SkillsStep from './SkillsStep';
import ExperienceStep from './ExperienceStep';
import EducationStep from './EducationStep';
import CertificatesStep from './CertificatesStep';
import { Certificates, Education, Experience, Profile, ResumeData, skills } from '@/types/types';
import Button from '../Button';
import FormLayout from './FomLayout';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import JobDescription from './JobDescription';
// import ResumePreview from "../resumes/ResumePreview";
// import JobDescription from "./JobDescription";

interface MultiStepFormProps {
  resumeContent: ResumeData;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({ resumeContent }) => {
  const [formData, setFormData] = useState<ResumeData>(resumeContent);

  useEffect(() => {
    setFormData(resumeContent);
  }, [resumeContent]);

  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = async () => {
    // Save on final step (step 6 -> completion)
    if (currentStep === 6) {
      setCurrentStep((prevStep) => Math.min(prevStep + 1, 7));
    } else {
      setCurrentStep((prevStep) => Math.min(prevStep + 1, 7));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  // const handleSaveDraft = async (item:{name:string ,value:any}) => {
  //   localStorage.setItem()

  // };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormLayout heading={"Let's start with your details"} subheading={'Provide essential information to proceed.'}>
            <UserInfoStep data={formData.profile} onChange={(data: Profile) => setFormData({ ...formData, profile: data })} />
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
            <ExperienceStep data={formData.experience} onChange={(data: Experience[]) => setFormData({ ...formData, experience: data })} />
          </FormLayout>
        );

      case 4:
        return (
          <FormLayout heading={'Add your Educations'} subheading={'Provide all your academic qualifications.'}>
            <EducationStep data={formData.education} onChange={(data: Education[]) => setFormData({ ...formData, education: data })} />
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
          <div className='text-center py-8'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7'></path>
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Resume Saved Successfully!</h3>
              <p className='text-gray-600 mb-4'>Your resume has been saved to your account.</p>
              <Button variant='primary' size='small' onClick={() => (window.location.href = '/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      default:
        return <div>Invalid Step</div>;
    }
  };
  const navigations = ['Profile', 'Skill', 'Experience', 'Education', 'Certificates', 'Job Description'];
  return (
    <div className='w-full grid place-items-center transition-all ease-in-out duration-300 '>
      <div className='w-full  grid gap-2 place-items-start p-2 box-border '>
        {currentStep != navigations.length + 1 && (
          <div className='w-full flex items-center justify-center gap-[12px]'>
            {navigations.map((item, index) => (
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
                <span className={`${index + 1 === currentStep ? 'max-[650px]:block' : 'max-[650px]:hidden'}`}>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className='w-full grid gap-2 place-items-center relative'>
          {renderStep()}

          {currentStep != navigations.length + 1 && (
            <div className='mt-6 gap-4 flex justify-between items-center'>
              <Button type='button' variant='secondary' size='small' onClick={handlePrevious} disabled={currentStep === 1}>
                <FaChevronLeft /> {currentStep === 7 ? 'Review' : 'Previous'}
              </Button>

              <div className='flex gap-2'>
                {/* Save Draft Button - available on all steps except completion */}
                {currentStep < 7 && (
                  <Button type='button' variant='secondary' size='small'>
                    {'Save Draft'}
                  </Button>
                )}

                <Button type='button' variant='primary' size='small' onClick={handleNext} disabled={currentStep === 7 || currentStep === 6}>
                  {currentStep === 6 ? 'Saving...' : currentStep === 6 ? 'Complete & Save' : 'Next'}
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
