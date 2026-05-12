import { MetadataRoute } from 'next'
import { listPublishedBlogs } from '@/services/blogCmsService'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://airesumecraft.xyz'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/builder`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic blog pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const { items } = await listPublishedBlogs({ limit: 1000, offset: 0 })
    blogPages = items.map((post) => {
      const publishedDate = new Date(post.publishedAt || post.createdAt)
      const ageInDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)

      // Boost priority for recent posts
      const priority = ageInDays < 7 ? 0.9 : ageInDays < 30 ? 0.8 : 0.7

      return {
        url: `${baseUrl}/blogs/${post.slug}`,
        lastModified: publishedDate,
        changeFrequency: 'weekly' as const,
        priority,
      }
    })
  } catch (error) {
    console.error('Failed to fetch blogs for sitemap:', error)
  }

  return [...staticPages, ...blogPages]
}
