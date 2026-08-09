import { NextResponse } from 'next/server'
import { EmailService } from '@/services/emailService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, message } = body || {}
    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const receiver = process.env.ADMIN_EMAIL || process.env.AUTH_EMAIL || 'noreplyresumecraft@gmail.com'
    const subject = `Contact form submission from ${name}`
    const plain = `Name: ${name}\nEmail: ${email}\n\n${message}`
    const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`

    // send message to the team/admin
    await EmailService.sendEmail(receiver, subject, plain, html)

    // send a confirmation email back to the submitter
    try {
      const confirmSubject = `We received your message — AI Resume Craft`
      const confirmPlain = `Hi ${name},\n\nThanks for getting in touch. We've received your message and our team will get back to you as soon as possible.\n\nYour message:\n${message}`
      const confirmHtml = `<p>Hi ${name},</p><p>Thanks for getting in touch. We've received your message and our team will get back to you as soon as possible.</p><hr/><p>Your message:</p><p>${message.replace(/\n/g, '<br/>')}</p><p>— The AI Resume Craft Team</p>`

      await EmailService.sendEmail(email, confirmSubject, confirmPlain, confirmHtml)
    } catch (confirmErr) {
      console.error('Failed to send confirmation email to submitter', confirmErr)
      // We still return success because the team received the message — confirmation can be retried later.
      return NextResponse.json({ success: true, info: 'sent_to_team_confirmation_failed' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
