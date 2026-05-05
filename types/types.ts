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
  styleConfig?: ResumeStyle;
  matchingScore?: number;
  analyzedAt?: string | Date;
  description?: string;
  createdAt?: string | Date;
  regenerationStatus?: 'idle' | 'pending' | 'running' | 'completed' | 'failed' | string;
  regenerationError?: string | null;
}

// ─── Style Editor Types ────────────────────────────────────────────────────

export type SectionTitleType = 'plain' | 'underline' | 'overline' | 'ribbon' | 'left-bar';
export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900;
export type TextTransform = 'none' | 'uppercase' | 'capitalize';
export type TextAlign = 'left' | 'center' | 'right';
export type BodyTextAlign = 'left' | 'justify' | 'center';
export type SectionSide = 'left' | 'right' | 'full';

export interface SectionTitleStyle {
  type: SectionTitleType;
  icon: string;           // emoji / unicode char — PDF-safe, no SVG
  iconEnabled: boolean;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: 'normal' | 'italic';
  textTransform: TextTransform;
  align: TextAlign;
}

export interface SectionOrder {
  key: string;   // 'summary' | 'experience' | 'education' | 'skills' | custom section id
  side?: SectionSide;
  label?: string;
  enabled?: boolean;
}

export interface ResumeStyle {
  accentColor: string;       // hex e.g. '#0ea5e9'
  lineColor: string;         // hex for dividers/borders
  headingFont: string;       // e.g. 'Inter'
  bodyFont: string;
  bodyFontSize: number;      // px, 10–14
  lineHeight: number;        // 1.2–1.8
  sectionGap: number;        // px between sections
  itemGap: number;           // px between items within a section
  sectionTitleStyle: SectionTitleStyle;
  sectionOrder: SectionOrder[];
  bodyTextAlign: BodyTextAlign;
  skillsGrouped: boolean;
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
  url?: string;
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