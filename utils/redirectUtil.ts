import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export async function redirectIfAuthenticated(redirectTo = '/builder') {
  const session = await getServerSession()
  if (session) redirect(redirectTo) // throws a redirect on server
  return null
}
