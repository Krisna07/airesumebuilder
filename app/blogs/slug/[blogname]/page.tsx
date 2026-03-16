import { notFound } from 'next/navigation'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'
import { getBlogBySlug } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export default async function BlogDetailPage({ params }: { params: Promise<{ blogname: string }> }) {
  const { blogname } = await params
  const post = await getBlogBySlug(blogname)

  if (!post || post.status !== 'published') {
    notFound()
  }

  return (
    <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header className="space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{post.title}</h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">{post.excerpt}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">By {post.author}</p>
        <time className="text-sm text-slate-500 dark:text-slate-400">
          {new Date(post.publishedAt || post.createdAt).toLocaleString()}
        </time>
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
    </article>
  )
}
