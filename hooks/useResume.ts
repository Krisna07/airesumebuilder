
import { ResumeService } from '@/services/resumeServices';
import { ResumeData } from '@/types/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResumeCache } from '@/lib/resumeCache';

export const useGetResume = (resumeId: string) => {
  const initial = typeof window !== 'undefined' ? ResumeCache.get(resumeId)?.data : undefined;
  return useQuery<ResumeData | undefined>({
    queryKey: ['resume', resumeId],
    enabled: !!resumeId,
    staleTime: 60_000,
    gcTime: 300_000,
    initialData: initial,
    retry: 1,
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
      const data = payload.data as ResumeData;
      // Update cache for faster subsequent loads
      if (typeof window !== 'undefined') {
        ResumeCache.set(resumeId, data, false);
        ResumeCache.markSynced(resumeId);
      }
      return data;
    }
});
};

export const useGetAllResumes = (userId: string | null) => {
  // Do not throw in a hook; use enabled to gate fetching
  return useQuery<ResumeData[] | undefined>({
    queryKey: ['allResumes', userId],
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
    queryFn: async () => { 
      if (!userId) return undefined;
      return await ResumeService.getAll(userId);
    }
  });
}

export const useSaveResume = (userId: string, resumeId: string, template: string, resumeData: ResumeData) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Skip save if unchanged from last synced
      const lastHash = ResumeCache.getLastSyncedHash(resumeId);
      const newHash = ResumeCache.computeHash(resumeData);
      if (lastHash && lastHash === newHash) {
        return new Response(null as unknown as BodyInit, { status: 200 });
      }
      return await ResumeService.save(userId, resumeId, template, resumeData);
    },
    onSuccess: async () => {
      // Update cache and mark synced
      ResumeCache.set(resumeId, { ...resumeData, template }, false);
      ResumeCache.markSynced(resumeId);
      // Invalidate queries for fresh reads
      await queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['allResumes', userId] });
    }
  })
}

export const useDeleteResume = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await ResumeService.delete(resumeId),
    onSuccess: async () => {
      // Clear cache and invalidate queries
      ResumeCache.clear(resumeId);
      await queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['allResumes'] });
    }
  })
}
