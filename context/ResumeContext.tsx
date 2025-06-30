'use client';

import { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import type { Resume } from '@/types/Resume';

// Define the shape of the context data
interface ResumeContextType {
  resume: Resume;
  setResume: Dispatch<SetStateAction<Resume>>;
}

// Create the context with a default value that throws an error if used outside a provider
const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resume, setResume] = useState<Resume>({
    personal: {
        name: '',
        email: '',
        phone: '',
        location: '',
        portfolio: '',
        linkedin: '',
        github: '',
    },
    workExperience: [],
    education: [],
    projects: [],
    skills: { technical: [], soft: [] },
    certifications: [],
    additionalSections: [],
  });

  return (
    <ResumeContext.Provider value={{ resume, setResume }}>
      {children}
    </ResumeContext.Provider>
  );
};

// Custom hook to use the resume context
export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
