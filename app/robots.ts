import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/llms.txt', '/blogs', '/features', '/blogs/', '/contact', '/pricing', '/privacy', '/terms'],
      disallow: ['/api/', '/account/', '/auth/', '/addblog/', '/addblogs/', '/builder', '/builder/'],
    },
    host: 'https://airesumecraft.xyz',
    sitemap: 'https://airesumecraft.xyz/sitemap.xml',
  }
}
