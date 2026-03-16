import Link from 'next/link'
import { listPublishedBlogs } from '@/services/blogCmsService'

export const runtime = 'nodejs'

export default async function BlogsPage() {
  let items: Awaited<ReturnType<typeof listPublishedBlogs>>['items'] = []

  try {
    const data = await listPublishedBlogs({ limit: 50, offset: 0 })
    items = data.items
  } catch (error) {
    console.error('Failed to render /blogs', error)
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Blogs</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Resume writing tips, product updates, and practical job-search guidance.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
          No blog posts published yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((post) => (
            <article key={post.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {post.coverImageId ? (
                <img
                  src={`/api/blog-images/${post.coverImageId}`}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              ) : null}

              <div className="p-4 space-y-3">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{post.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">By {post.author}</p>
                    <time className="block text-xs text-slate-500 dark:text-slate-400">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  <Link
                    href={`/blogs/slug/${post.slug}`}
                    className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Read
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
