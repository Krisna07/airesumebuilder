import { useAuth } from '@/context/authContext';
import { ResumeService } from '@/services/resumeServices';
import { ResumeData } from '@/types/types';
import { useMutation, useQuery } from '@tanstack/react-query';




export const useGetResume = (resumeId: string) => {
  return useQuery<ResumeData | undefined>({
    queryKey: ['allJd', resumeId], // Unique key based on userId 
    queryFn: async () => {
      const response = await ResumeService.getSingle(resumeId);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Failed to fetch resume');
      }
      const payload = await response.json();
      if (!payload?.data) {
        throw new Error('Resume not found');
      }
      return payload.data as ResumeData;
    }
});
};

export const useGetAllResumes = (userId: string | null) => {
  const { user } = useAuth()
  if (!user) throw new Error('User ID is required');
  return useQuery({
    queryKey: ['allResumes', userId], // Unique key based on userId 
    queryFn: async () => { 
     return await ResumeService.getAll(userId);
    } 
});
}

export const useSaveResume = (userId: string | undefined, resumeId: string, template: string, resumeData: ResumeData) => {
  const { user } = useAuth()
  if (!user) throw new Error('User ID is required');
  return useMutation({
    mutationFn: async () => await ResumeService.save(userId ?? user.id, resumeId, template, resumeData)
  })
}

export const useDeleteResume = (resumeId: string) => {
  return useMutation({
    mutationFn: async()=> await ResumeService.delete(resumeId)
  })
}
