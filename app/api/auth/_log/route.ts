import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null)

    if (payload) {
      console.error('[next-auth][client-log]', payload)
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

export const dynamic = 'force-dynamic'
