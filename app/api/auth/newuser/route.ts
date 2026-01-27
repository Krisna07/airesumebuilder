import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// import { validate } from 'deep-email-validator'; // Properly destructure validate
import { EmailService } from '@/utils/sendEmail';

export async function PUT(req: NextRequest) {
  try {
    let user;
    const { email, name, image, provider, providerId, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // OAuth user creation or update
    if (provider !== 'credentials') {
      if (!existingUser) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            isVerified: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            isVerified: true,
          },
        });
      }
    }

    // Credentials-based signup
    if (provider === 'credentials') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for credentials signup.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (existingUser) {
        if (existingUser.password) {
          return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
        }

        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
          },
        });
      } else {
        // Validate email
        // const validateEmail = await validate(email);
        // if (!validateEmail.valid) {
        //   return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        // }
        // Generate verification details and store in DB
        const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const code = generateVerificationCode()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // Send welcome email with the code
        const emailResponse = await EmailService.sendVerificationCode(email, name || email.split('@')[0], code);
        if (emailResponse && 'error' in emailResponse) {
          console.error('Failed to send verification email:', emailResponse.error);
          return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
        }
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
            isVerified: false,
          },
        });
        // Create verification record in DB
        await prisma.verification.create({
          data: {
            userId: user.id,
            code,
            expiresAt,
          }
        })

        return NextResponse.json({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            provider: user.provider,
            providerId: user.providerId,
            isVerified: false,
          },
        }, { status: 200 });
      }
    }

    if (user) {
      return NextResponse.json({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          provider: user.provider,
          providerId: user.providerId,
          isVerified: !!user.password, // Mark as verified if password exists
        },
      }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User creation failed.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}



