export function isAdminEmail(email?: string | null) {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS || ''
  const list = raw
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
