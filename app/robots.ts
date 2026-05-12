import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/blogs', '/features', '/blogs/', '/builder', '/contact', '/pricing', '/privacy', '/terms'],
      disallow: ['/api/', '/account/', '/auth/', '/addblog/', '/addblogs/'],
    },
    sitemap: 'https://airesumecraft.xyz/sitemap.xml',
  }
}
