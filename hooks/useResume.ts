import { ResumeService } from '@/services/resumeServices';
import { ResumeData } from '@/types/types';
import { useMutation, useQuery } from '@tanstack/react-query';


export const useGetResume = (resumeId: string) => {
  return useQuery({
    queryKey: ['allJd', resumeId], // Unique key based on userId 
    queryFn: async () => { 
     return await ResumeService.getSingle(resumeId);
    }
});
};

export const useGetAllResumes = (userId: string | null) => {
  return useQuery({
    queryKey: ['allResumes', userId], // Unique key based on userId 
    queryFn: async () => { 
     return await ResumeService.getAll(userId);
    } 
});
}

export const useSaveResume = (userId: string | undefined, resumeId: string, template: string, resumeData: ResumeData) => {
  if(!userId) throw new Error('User ID is required');
  return useMutation({
    mutationFn: async()=> await ResumeService.save(userId, resumeId, template, resumeData)
  })
}

export const useDeleteResume = (resumeId: string) => {
  return useMutation({
    mutationFn: async()=> await ResumeService.delete(resumeId)
  })
}
