import Link from 'next/link'
import { listPublishedBlogs } from '@/services/blogCmsService'
import BlogHeader from './BlogHeader'

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
      <BlogHeader />
      {items.length === 0 ? (
        <div className="rounded-xl border  border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
          No blog posts published yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((post) => (
            <Link href={`/blogs/${post.slug}`} key={post.id} className="rounded-xl select-none border border-slate-200 dark:border-slate-700 group overflow-hidden hover:shadow-lg dark:hover:shadow-[0px_2px_8px_0_white] transition-all ease-in-out duration-300 ">
              <article>
                <div className='overflow-hidden bg-green-200'>
                  {post.coverImageId ? (
                    <img
                      src={`/api/blog-images/${post.coverImageId}`}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-[1.1] transition-all eas-in-out duration-300"
                    />
                  ) : null}
                </div>
                <div className="p-4 space-y-3">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{post.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between border-t dark:border-gray-200/25 border-gray-200 pt-2">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">By {post.author}</p>
                      <time className="block text-xs text-slate-500 dark:text-slate-400">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    <span className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer select-none">
                      Read
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
