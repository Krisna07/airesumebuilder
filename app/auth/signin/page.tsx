import LoginForm from '@/components/Forms/authForms/LoginForm'
import { redirectIfAuthenticated } from '@/utils/redirectUtil'
import React from 'react'
export default async function Page() {
  await redirectIfAuthenticated('/builder')
  return <LoginForm />
}

