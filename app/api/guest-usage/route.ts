import { NextResponse } from 'next/server'
import { getGuestUsageSnapshot } from '@/services/guestService'

export async function GET() {
  const snapshot = await getGuestUsageSnapshot()
  return NextResponse.json(snapshot)
}