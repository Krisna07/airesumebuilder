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
  certificates: Certificates[];
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
export interface Certificates {
  title: string;
  issued_by: string;
  year: string;
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
