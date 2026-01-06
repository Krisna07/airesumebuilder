import { useQuery } from '@tanstack/react-query';
import { JobDescriptionService } from '@/services/jdServices';

export const useJobDescriptions = (userId: string, resumeId?: string) => {
  return useQuery({
    queryKey: ['allJd', userId, resumeId], // Unique key based on userId and resumeId
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return await JobDescriptionService.getAll(userId, resumeId);
    }
});
};