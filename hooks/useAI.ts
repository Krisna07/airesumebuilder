import { useMutation } from '@tanstack/react-query';
import { ResumeData } from '@/types/types';

export type RegenerateSectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'customSections';

interface GenerateSectionPayload {
  sectionKey: RegenerateSectionKey;
  resumeData: ResumeData;
  jobDescription?: string;
}

interface GenerateSectionResponse {
  success: boolean;
  data: Partial<ResumeData>;
  error?: string;
}

export function useGenerateSection() {
  return useMutation({
    mutationFn: async (payload: GenerateSectionPayload): Promise<GenerateSectionResponse> => {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to regenerate section');
      }

      return body as GenerateSectionResponse;
    },
  });
}
