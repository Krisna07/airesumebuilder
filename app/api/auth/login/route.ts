import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encode } from 'next-auth/jwt'

type LoginBody = {
  email?: string
  password?: string
}

export async function POST(req: Request) {
  try {
    const body: LoginBody = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Build a token payload compatible with NextAuth's getToken
    const token = {
      sub: user.id,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      image: user.image ?? undefined,
      // include any flags you need (isVerified, plan is added in jwt callback normally)
      isVerified: Boolean(user.isVerified ?? false),
      provider: 'credentials',
      providerId: user.id,
    }

    const jwt = await encode({ token, secret })

    const safeUser = {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      isVerified: Boolean(user.isVerified ?? false),
    }

    return NextResponse.json({ token: jwt, user: safeUser }, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Login error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
