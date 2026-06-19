import LoginForm from '@/components/Forms/authForms/LoginForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'

type SignInPageSearchParams = Promise<{ next?: string | string[] }>

export default async function Page({
  searchParams,
}: {
  searchParams?: SignInPageSearchParams
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const rawNext = resolvedSearchParams?.next
  const next = typeof rawNext === 'string' && rawNext.startsWith('/') ? rawNext : '/builder'
  await redirectIfAuthenticated(next)
  return <div className='w-full h-[80vh] grid place-items-center md:py-8 px-4'>
    <LoginForm />
  </div>
}

