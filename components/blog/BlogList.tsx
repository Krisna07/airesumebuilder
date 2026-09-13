"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import BlogCard from './BlogCard'
import type { BlogListItem } from '@/types/blog'

interface Props {
    initialItems: BlogListItem[]
}

export default function BlogList({ initialItems }: Props) {
    const { user } = useAuth()
    const [items, setItems] = useState(initialItems)

    useEffect(() => {
        if (!user?.isAdmin) return

        let cancelled = false
        fetch('/api/blogs?includeAll=1&limit=50')
            .then((res) => res.json())
            .then((payload) => {
                if (cancelled) return
                if (payload?.success) {
                    setItems(payload.data.items)
                } else {
                    console.error('Failed to load admin blog list:', payload?.error)
                }
            })
            .catch((err) => console.error('Failed to load admin blog list:', err))

        return () => {
            cancelled = true
        }
    }, [user?.isAdmin])

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
                No blog posts published yet.
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {items.map((post) => (
                <BlogCard key={post.id} post={post} />
            ))}
        </div>
    )
}
