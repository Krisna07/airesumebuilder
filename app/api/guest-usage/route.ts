import { NextResponse } from 'next/server'
import { getGuestUsageSnapshot } from '@/lib/guest-usage'

export async function GET() {
  const snapshot = await getGuestUsageSnapshot()
  return NextResponse.json(snapshot)
}