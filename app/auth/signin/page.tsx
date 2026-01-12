import LoginForm from '@/components/Forms/authForms/LoginForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'
export default async function Page() {
  await redirectIfAuthenticated('/builder')
  return <div className='w-full h-[80vh] grid place-items-center md:py-8 px-4'>
    <LoginForm />
  </div>
}

