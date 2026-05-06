import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AddBlogsRootAliasPage() {
  redirect('/blogs/addblogs')
}
