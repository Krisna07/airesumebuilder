import { notFound } from 'next/navigation'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'
import { getBlogBySlug, listRelatedByAuthor } from '@/services/blogCmsService'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

export default async function BlogDetailPage({ params }: { params: Promise<{ blogname: string }> }) {
  const { blogname } = await params
  const post = await getBlogBySlug(blogname)

  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.isAdmin

  if (!post || (post.status !== 'published' && !isAdmin)) {
    notFound()
  }

  const related = await listRelatedByAuthor(post.author, post.id, 4)
  return (
    <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
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
      <section className="mt-12">
        <h3 className="text-xl font-semibold mb-4">Related posts</h3>
        {related.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((item) => (
              <Link key={item.id} href={`/blogs/${item.slug}`} className="block rounded-lg border p-3 hover:shadow">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No related posts yet.</p>
        )}
      </section>
    </article>
  )
}
