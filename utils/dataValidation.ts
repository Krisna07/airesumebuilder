import { ResumeData, CustomSectionData } from '@/types/types';

/**
 * Validates and sanitizes resume data to ensure it has the correct structure
 */
export function validateResumeData(data: Record<string, unknown>): ResumeData {
  // Ensure customSections is always an array
  const sanitizedData = {
    ...data,
    customSections: Array.isArray(data.customSections) ? data.customSections : [],
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    educations: Array.isArray(data.educations) ? data.educations : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    profile: data.profile || {
      fullname: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: ''
    }
  };

  return sanitizedData as ResumeData;
}

/**
 * Validates and sanitizes custom sections data
 */
export function validateCustomSections(customSections: unknown): CustomSectionData[] {
  if (!Array.isArray(customSections)) {
    return [];
  }

  return customSections.map((section: Record<string, unknown>) => ({
    id: typeof section.id === 'string' ? section.id : Date.now().toString(),
    title: typeof section.title === 'string' ? section.title : '',
    subsections: Array.isArray(section.subsections) 
      ? section.subsections.map((sub: Record<string, unknown>) => ({
          id: typeof sub.id === 'string' ? sub.id : Date.now().toString(),
          title: typeof sub.title === 'string' ? sub.title : '',
          content: typeof sub.content === 'string' ? sub.content : '',
          date: typeof sub.date === 'string' ? sub.date : undefined
        }))
      : []
  }));
}

/**
 * Safely parses JSON data with fallback to default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null ? parsed : fallback;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}