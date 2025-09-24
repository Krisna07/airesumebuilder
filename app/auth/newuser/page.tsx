import SignUpForm from '@/components/Forms/authForms/SignUpForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'


const page = async () => {
  await redirectIfAuthenticated('/builder')
  return (
    <SignUpForm />
  )
}

export default page