import { notFound } from 'next/navigation'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'
import { getBlogBySlug } from '@/services/blogCmsService'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Metadata } from 'next'
import type { BlogPost } from '@/types/blog'
import RelatedPosts from '@/components/blog/RelatedPosts'

export const runtime = 'nodejs'
export const revalidate = 3600 // Revalidate every hour

function estimateReadingTime(sections: BlogPost['sections']): number {
  const totalWords = sections.reduce((acc, section) => {
    if ('content' in section && typeof section.content === 'string') {
      return acc + section.content.split(/\s+/).length
    }
    if ('items' in section && Array.isArray(section.items)) {
      return acc + section.items.join(' ').split(/\s+/).length
    }
    return acc
  }, 0)
  return Math.max(1, Math.ceil(totalWords / 200))
}

export async function generateMetadata({ params }: { params: Promise<{ blogname: string }> }): Promise<Metadata> {
  const { blogname } = await params
  const post = await getBlogBySlug(blogname)

  if (!post) {
    return {
      title: 'Blog Not Found',
    }
  }

  const canonicalUrl = `https://airesumecraft.xyz/blogs/${post.slug}`
  const imageUrl = post.coverImageId
    ? `https://airesumecraft.xyz/api/blog-images/${post.coverImageId}`
    : 'https://airesumecraft.xyz/icon.svg'

  return {
    title: `${post.title} | AI Resume Craft Blog`,
    description: post.excerpt,
    keywords: post.seoKeywords || [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [
        {
          url: imageUrl,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ blogname: string }> }) {
  const { blogname } = await params
  const post = await getBlogBySlug(blogname)

  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.isAdmin

  if (!post || (post.status !== 'published' && !isAdmin)) {
    notFound()
  }

  const readingTime = estimateReadingTime(post.sections)

  // Structured data for individual blog post
  const imageUrl = post.coverImageId
    ? `https://airesumecraft.xyz/api/blog-images/${post.coverImageId}`
    : 'https://airesumecraft.xyz/icon.svg'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author,
      image: post.authorImageUrl || post.authorImageId
        ? post.authorImageUrl || `https://airesumecraft.xyz/api/blog-images/${post.authorImageId}`
        : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Resume Craft',
      url: 'https://airesumecraft.xyz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://airesumecraft.xyz/icon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://airesumecraft.xyz/blogs/${post.slug}`,
    },
  }

  // Breadcrumb structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://airesumecraft.xyz',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://airesumecraft.xyz/blogs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://airesumecraft.xyz/blogs/${post.slug}`,
      },
    ],
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blogs" className="hover:text-slate-900 dark:hover:text-slate-100">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={post.title}>
              {post.title}
            </li>
          </ol>
        </nav>
      <header className="space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{post.title}</h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">{post.excerpt}</p>
        <div className='flex items-center gap-2'>
          <div className='rounded-full w-8 h-8 overflow-hidden'>
            {post.authorImageUrl || post.authorImageId ?
              <img src={post.authorImageUrl || post.authorImageId ? post.authorImageUrl || `/api/blog-images/${post.authorImageId}` : ''} className='w-full h-full object-cover' /> :
              <div className='w-full h-full bg-linear-to-r from-green-300 to-indigo-300'></div>

            }
          </div>
          |
          <div className='grid'>
            <p className="text-sm text-slate-500 dark:text-slate-400">By {post.author}</p>
            <time className="text-xs text-slate-500 dark:text-slate-400 ">
              {new Date(post.publishedAt || post.createdAt).toLocaleString()}
            </time>
          </div>
            |
            <span className="text-sm text-slate-500 dark:text-slate-400">{readingTime} min read</span>
        </div>
      </header>

      {post.coverImageId ? (
        <img
          src={`/api/blog-images/${post.coverImageId}`}
          alt={post.title}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 mb-8"
        />
      ) : null}

      <section>
        {post.sections.map((section) => (
          <BlogSectionRenderer key={section.id} section={section} />
        ))}
      </section>

      {/* Related posts */}
        <RelatedPosts blogId={post.id} limit={5} />
    </article>
    </>
  )
}
