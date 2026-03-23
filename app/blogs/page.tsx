import { listPublishedBlogs } from '@/services/blogCmsService'
import BlogHeader from './BlogHeader'
import BlogCard from '@/components/blog/BlogCard'

// Revalidate this page every 60 seconds to show newly published blogs without a full redeploy
export const revalidate = 60

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
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
