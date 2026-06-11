import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
  },
})

// Cache invalidation patterns
export const QUERY_KEYS = {
  resumeData: (userId?: string) => userId ? ['resumeData', userId] : ['resumeData'],
  subscription: (userId?: string) => userId ? ['subscription', userId] : ['subscription'],
  user: (userId?: string) => userId ? ['user', userId] : ['user'],
} as const

// Invalidate all queries when user logs in
export async function invalidateAuthQueries() {
  await queryClient.invalidateQueries({
    queryKey: ['resumeData'],
  })
  await queryClient.invalidateQueries({
    queryKey: ['subscription'],
  })
  await queryClient.invalidateQueries({
    queryKey: ['user'],
  })
}

// Clear all queries when user logs out
export function clearAllQueries() {
  queryClient.clear()
}
