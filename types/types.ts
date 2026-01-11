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
  createdAt?: string | Date;
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
  id: string;
  jobDescription: string;
  description: string;
  matchingPercentage: number;
  suggestions: string[];
  role?: string;
  result?: string;
  missingKeywords?: string[];
  strengths?: string[];
  updatedAt?: string | Date;
}

export interface CoverLetter {
  salutation: string;
  coverLetter: string;
  closing: string;
  keyParagraphs: { purpose: string; text: string }[];
  highlights: { title: string; text: string }[];
  tone: string;
  wordCount: number;
}

export interface JobDescription {
  id: string;
  description: string;
  title: string;
  company: string;
  location: string;
  domain: string;
  url: string;
  cretedAt?: string | Date;
  updatedAt?: string | Date;
}

export type JobDetailsWithAnalysis = JobDescription & {
  analysis?: AnalysisResult;
  hasAnalysed?: boolean;
};

export interface CoverLetterResponse {
  salutation: string
  coverLetter: string
  closing: string
  keyParagraphs: { purpose: string; text: string }[]
  highlights: { title: string; text: string }[]
  tone: string
  wordCount: number
}