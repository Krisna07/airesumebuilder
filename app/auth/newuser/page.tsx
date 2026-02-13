import SignUpForm from '@/components/Forms/authForms/SignUpForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'


const page = async () => {
  await redirectIfAuthenticated('/builder')
  return (
    <div className='w-full h-[80vh] grid place-items-center md:py-8 px-4'><SignUpForm /></div>
  )
}

export default page