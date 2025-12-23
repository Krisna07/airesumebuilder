import JobDescription from "@/components/Forms/JobDescription";

export interface User {
  id: string;
  email: string;
  name?: string;
}
export interface ResumeData {
  id: string,
  userId: string,
  title: string,
  template: string,
  profile: Profile;
  skills: skills[];
  experiences: Experience[];
  educations: Education[];
  customSections: CustomSectionData[];
  matchingScore?: number;
  analyzedAt?: string | Date;
  description?: string;
}

export interface skills {
  type?: string;
  skills?: string[];
}

export interface Profile {
  fullname: string;
  email: string;
  phone: string;
  location: string;
  links: { type: string; url: string }[];
  summary: string;
}
export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  responsibilities?: string[];
}
export interface Education {
  degree: string;
  university: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location: string;
}
export interface CustomSubsection {
  id: string;
  title: string;
  content: string; // Rich text/markdown content
  date?: string; // Single date field
}

export interface CustomSectionData {
  id: string;
  title: string;
  subsections: CustomSubsection[];
}
export interface UserResume {
  content: string;
  template: "modern" | "classic" | "minimal";
}

export interface AnalysisResult {
  jobDescription: string;
  description: string;
  matchingPercentage: number;
  suggestions: string[];
  role?: string;
  missingKeywords?: string[];
  strengths?: string[];
}

export interface JobDescription {
  id: string;
  description: string;
  title: string;
  company: string;
  location: string;
  domain: string;
  url: string
}