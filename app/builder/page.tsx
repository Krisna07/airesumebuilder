'use client';

import { ResumeProvider } from '@/context/ResumeContext';
import { useAuth } from '@/context/AuthContext';
import PersonalDetails from '@/components/steps/PersonalDetails';
import WorkExperience from '@/components/steps/WorkExperience';
import Education from '@/components/steps/Education';
import Projects from '@/components/steps/Projects';
import SkillsCertifications from '@/components/steps/SkillsCertifications';
import ResumePreview from '@/components/ResumePreview';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import GenerateButton from '@/components/GenerateButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { User, Briefcase, GraduationCap, Lightbulb, Star, FileText, ArrowLeft, ArrowRight, Save, LogOut } from 'lucide-react';
import Link from 'next/link';

const ResumeUpload = dynamic(() => import('@/components/ResumeUpload'), { ssr: false });

const steps = [
  { id: 'profile', label: 'Profile', component: <PersonalDetails />, icon: <User /> },
  { id: 'skills', label: 'Skills', component: <SkillsCertifications />, icon: <Star /> },
  { id: 'experience', label: 'Experience', component: <WorkExperience />, icon: <Briefcase /> },
  { id: 'education', label: 'Education', component: <Education />, icon: <GraduationCap /> },
  { id: 'projects', label: 'Projects', component: <Projects />, icon: <Lightbulb /> },
  { id: 'job-description', label: 'Job Description', component: <JobDescriptionInput />, icon: <FileText /> },
];

export default function Builder() {
  const [step, setStep] = useState(0);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  // const searchParams = useSearchParams();
  // const resumeId = searchParams?.get('resumeId'); // TODO: Load existing resume

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const saveResume = async () => {
    // TODO: Implement save functionality
    console.log('Saving resume...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <ResumeProvider>
      <div className="flex flex-col h-screen bg-gray-50 font-sans">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            AI Resume Builder
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
            >
              Dashboard
            </Link>
            <button 
              onClick={saveResume}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </button>
            <span className="text-sm text-gray-500">
              {user.email}
            </span>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden">
          {/* Left Side: Form & Controls */}
          <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <ResumeUpload />
              </div>

              {/* Stepper */}
              <div className="mb-8 flex items-center justify-center flex-wrap gap-y-4">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${i === step ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      onClick={() => setStep(i)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors ${i === step ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}>
                        {s.icon}
                      </div>
                      <span className={`font-medium ${i === step ? 'text-black' : 'text-gray-500'}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className="ml-4 w-12 h-px bg-gray-200"></div>}
                  </div>
                ))}
              </div>

              {/* Form Content */}
              <div className="p-8 border rounded-xl bg-white shadow-lg min-h-[400px] text-gray-800">
                {steps[step].component}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                    className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <GenerateButton />
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Resume Preview */}
          <div className="hidden lg:block w-1/2 p-6 bg-white border-l">
            <div className="sticky top-6">
              <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Live Preview</h2>
              <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                <div className="h-[calc(100vh-140px)] overflow-y-auto rounded-lg bg-white shadow-md">
                  <ResumePreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResumeProvider>
  );
}
