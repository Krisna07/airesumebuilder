import Link from "next/link"
import { ArrowRight, Calendar, User } from "lucide-react"
import { listPublishedBlogs } from "@/services/blogCmsService"
import Image from "next/image"

/**
 * Blog Resources Section Component
 * 
 * Displays featured blog posts on the homepage
 * SEO-optimized content showcasing resume tips, interview advice, and career resources
 */
export default async function BlogResourcesSection() {
  // Fetch real blog posts from CMS
  let featuredPosts: Array<{
    title: string
    excerpt: string
    author: string
    date: string
    slug: string
    coverImageId?: string
  }> = []
 
  try {
    const data = await listPublishedBlogs({ limit: 3, offset: 0 })
    featuredPosts = data.items.map((blog) => ({
      title: blog.title,
      excerpt: blog.excerpt,
      author: blog.author,
      date: blog.publishedAt 
        ? new Date(blog.publishedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : new Date(blog.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
      slug: blog.slug,
      coverImageId: blog.coverImageId
    }))
  } catch (error) {
    console.error('Failed to fetch blogs for homepage', error)
    // Fallback to empty array if fetch fails
  }

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div className="text-left mb-6 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Resources and Insights
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              The latest tips for resume making, cover letters, interviews, and more.
            </p>
          </div>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors group"
          >
            See All Articles
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post, index) => (
              <Link
                key={index}
                href={`/blogs/${post.slug}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 pb-4 grid">
                  {/* Cover Image */}
                  {post.coverImageId && (
                    <div className="relative w-full h-[200px] mb-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <Image
                        src={`/api/blog-images/${post.coverImageId}`}
                        alt={post.title}
                        fill
                        sizes="(max-width: 767px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>

                {/* Read More Link */}
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 group-hover:gap-3 transition-all">
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
              <p>No blog posts available yet. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Trust Badge */}
        {/* <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-slate-900 dark:text-white">4.8</span>
            </div>
            <span className="text-slate-600 dark:text-slate-300">|</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Trusted by <span className="font-semibold text-slate-900 dark:text-white">1.4m+</span> users
            </span>
          </div>
        </div> */}
      </div>
    </section>
  )
}
