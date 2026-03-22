'use client'

import Button from "@/components/Ui/Button"
import { useAuth } from "@/context/authContext"
import { useSession } from "next-auth/react"
import Link from "next/link"


const BlogHeader = () => {
  const {user} = useAuth()

  return <>
    <header className="space-y-2 flex items-center justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Blogs</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Resume writing tips, product updates, and practical job-search guidance.
        </p>
      </div>
    {user?.isAdmin &&  <Link href={'/addblog'}>
      <Button children="Add blog" variant='primary' size="small" className="whitespace-nowrap" />
      </Link>}
    </header>
    </>
}

export default BlogHeader