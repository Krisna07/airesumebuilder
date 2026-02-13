import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/utils/sendEmail'
import { buildWelcomeEmail } from '../newuser/welcomeEmail'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const verification = await prisma.verification.findFirst({ where: { userId: user.id, code } })
    if (!verification) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (new Date(verification.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }


    const emailContent = buildWelcomeEmail(user.name || email.split('@')[0]);
    await prisma.user.update({ where: { email }, data: { isVerified: true } })
    const emailResponse = await EmailService.sendEmail(email, emailContent.subject, emailContent.text, emailContent.html);
    if (emailResponse && 'error' in emailResponse) {
      console.error('Failed to send welcome email:', emailResponse.error);
    }
    // delete verification record
    await prisma.verification.delete({ where: { id: verification.id } })



    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error verifying user:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
