"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'
import type { BlogListItem } from '@/types/blog'

interface Props {
    post: BlogListItem
}

export default function BlogCard({ post }: Props) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Delete this blog post? This cannot be undone.')) return
        try {
            setLoading(true)
            const res = await fetch(`/api/blogs/${post.id}`, { method: 'DELETE' })
            const payload = await res.json()
            if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Failed')
            showToast('Blog archived')
            // reload page
            window.location.reload()
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Delete failed')
        } finally {
            setLoading(false)
        }
    }

    const togglePublish = async () => {
        const newStatus = post.publishedAt ? 'draft' : 'published'
        if (!confirm(`${newStatus === 'published' ? 'Publish' : 'Unpublish'} this post?`)) return
        try {
            setLoading(true)
            const res = await fetch(`/api/blogs/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            const payload = await res.json()
            if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Failed')
            showToast(newStatus === 'published' ? 'Published' : 'Moved to draft')
            window.location.reload()
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Update failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-xl select-none border border-slate-200 dark:border-slate-700 group overflow-hidden hover:shadow-lg dark:hover:shadow-[0px_2px_8px_0_white] transition-all ease-in-out duration-300">
            <Link href={`/blogs/${post.slug}`} className="block">
                <article>
                    <div className='overflow-hidden bg-green-200'>
                        {post.coverImageId ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                            <div className="space-y-0.5 flex items-center gap-2" >
                                <div className='rounded-full w-8 h-8 overflow-hidden'>
                                    {post.authorImageUrl || post.authorImageId ?
                                        <img src={post.authorImageUrl || post.authorImageId ? post.authorImageUrl || `/api/blog-images/${post.authorImageId}` : ''} className='w-full h-full object-cover' /> :
                                        <div className='w-full h-full bg-linear-to-r from-green-300 to-indigo-300'></div>

                                    }
                               </div>
                                <div><p className="text-xs text-slate-500 dark:text-slate-400">By {post.author}</p>
                                    <time className="block text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                    </time>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer select-none">
                                Read
                            </span>
                        </div>
                    </div>
                </article>
            </Link>

            {user?.isAdmin && (
                <div className="p-3 border-t flex items-center gap-2 justify-end">
                    <Link
                        href={`/blogs/addblogs?editId=${post.id}`}
                        className="px-3 py-1 rounded bg-slate-100 text-sm dark:bg-slate-700 dark:text-slate-100"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={togglePublish}
                        disabled={loading}
                        className="px-3 py-1 rounded bg-amber-100 text-sm dark:bg-amber-700 dark:text-neutral-900"
                    >
                        {post.publishedAt ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-3 py-1 rounded bg-red-100 text-sm text-red-700 dark:bg-red-700 dark:text-white"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}
