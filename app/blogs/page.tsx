import { listPublishedBlogs } from '@/services/blogCmsService'
import BlogHeader from './BlogHeader'
import BlogCard from '@/components/blog/BlogCard'
import { Metadata } from 'next'
import Link from 'next/link'

// Revalidate this page every 60 seconds to show newly published blogs without a full redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog | AI Resume Craft - Resume Tips & Career Advice',
  description: 'Discover expert tips on resume writing, career development, and job search strategies. Learn how to craft the perfect resume with AI-powered tools.',
  keywords: [
    'resume tips',
    'career advice',
    'job search strategies',
    'AI resume builder',
    'resume writing',
    'cover letter tips',
    'job application',
    'career development',
    'professional resume',
    'ATS optimization',
  ],
  authors: [{ name: 'AI Resume Craft' }],
  alternates: {
    canonical: 'https://airesumecraft.xyz/blogs',
  },
  openGraph: {
    title: 'Blog | AI Resume Craft - Resume Tips & Career Advice',
    description: 'Discover expert tips on resume writing, career development, and job search strategies. Learn how to craft the perfect resume with AI-powered tools.',
    url: 'https://airesumecraft.xyz/blogs',
    siteName: 'AI Resume Craft',
    type: 'website',
    images: [
      {
        url: 'https://airesumecraft.xyz/icon.svg',
        alt: 'AI Resume Craft Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | AI Resume Craft - Resume Tips & Career Advice',
    description: 'Expert resume tips and career advice to help you land your dream job',
    images: ['https://airesumecraft.xyz/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function BlogsPage() {
  let items: Awaited<ReturnType<typeof listPublishedBlogs>>['items'] = []

  try {
    const data = await listPublishedBlogs({ limit: 50, offset: 0 })
    items = data.items
  } catch (error) {
    console.error('Failed to render /blogs', error)
  }

  // Structured data for better SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AI Resume Craft Blog',
    description: 'Expert tips on resume writing, career development, and job search strategies',
    url: 'https://airesumecraft.xyz/blogs',
    publisher: {
      '@type': 'Organization',
      name: 'AI Resume Craft',
      url: 'https://airesumecraft.xyz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://airesumecraft.xyz/icon.svg',
      },
    },
    blogPost: items.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://airesumecraft.xyz/blogs/${post.slug}`,
      datePublished: post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      image: post.coverImageId
        ? `https://airesumecraft.xyz/api/blog-images/${post.coverImageId}`
        : 'https://airesumecraft.xyz/icon.svg',
    })),
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <BlogHeader />
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-7">
            Looking for practical next steps after these resume guides?
            {' '}
            <Link href="/builder" className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
              Start building your ATS-ready resume
            </Link>
            , explore our
            {' '}
            <Link href="/features" className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
              AI resume features
            </Link>
            , or compare plans on
            {' '}
            <Link href="/pricing" className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
              pricing
            </Link>
            .
          </p>
        </div>
        {items.length === 0 ? (
          <div className="rounded-xl border  border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
            No blog posts published yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
