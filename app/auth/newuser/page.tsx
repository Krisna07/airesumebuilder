import SignUpForm from '@/components/Forms/authForms/SignUpForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'


const page = async () => {
  await redirectIfAuthenticated('/builder')
  return (
    <div className='place-items-center md:py-8'><SignUpForm /></div>
  )
}

export default page