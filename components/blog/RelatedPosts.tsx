'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/types/blog'

interface RelatedPostsProps {
  blogId: string
  limit?: number
}

interface RelatedPostsResponse {
  success: boolean
  data?: {
    relatedPosts: BlogPost[]
    count: number
  }
  error?: string
}

export default function RelatedPosts({ blogId, limit = 5 }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelatedPosts() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/blogs/${blogId}/related?limit=${limit}`)
        const data: RelatedPostsResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch related posts')
        }

        if (data.success && data.data) {
          setRelatedPosts(data.data.relatedPosts)
        }
      } catch (err) {
        console.error('Error fetching related posts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load related posts')
      } finally {
        setLoading(false)
      }
    }

    if (blogId) {
      fetchRelatedPosts()
    }
  }, [blogId, limit])

  if (loading) {
    return (
      <section className="mt-12">
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Related Posts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="block rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-12">
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Related Posts</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Unable to load related posts at this time.</p>
      </section>
    )
  }

  return (
    <section className="mt-12">
      <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Related Posts</h3>
      {relatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blogs/${post.slug}`}
              className="block rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              {post.coverImageId && (
                <img
                  src={`/api/blog-images/${post.coverImageId}`}
                  alt={post.title}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No related posts yet.</p>
      )}
    </section>
  )
}
