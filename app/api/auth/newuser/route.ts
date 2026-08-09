import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// import { validate } from 'deep-email-validator'; // Properly destructure validate
import { EmailService } from '@/services/emailService';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function upsertVerification(userId: string, code: string, expiresAt: Date) {
  const existingVerification = await prisma.verification.findFirst({ where: { userId } });

  if (existingVerification) {
    return prisma.verification.update({
      where: { id: existingVerification.id },
      data: { code, expiresAt },
    });
  }

  return prisma.verification.create({
    data: {
      userId,
      code,
      expiresAt,
    },
  });
}

export async function PUT(req: NextRequest) {
  try {
    let user;
    const { email, name, image, provider, providerId, password } = await req.json();
    const normalizedProvider = provider === 'credentials' ? 'credentials' : (provider || 'credentials')

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // OAuth user creation or update
    if (normalizedProvider !== 'credentials') {
      if (!existingUser) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
            provider: normalizedProvider,
            providerId: providerId || null,
            password: null,
            isVerified: true,
          },
        });
      } else {
        if (existingUser.password && !existingUser.deletedAt) {
          return NextResponse.json({ error: 'EXISTING_ACCOUNT_WITH_PASSWORD' }, { status: 409 })
        }

        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
            provider: normalizedProvider,
            providerId: providerId || null,
            password: null,
            isVerified: true,
          },
        });
      }
    }

    // Credentials-based signup
    if (normalizedProvider === 'credentials') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for credentials signup.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      if (existingUser) {
        if (existingUser.password) {
          return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
        }

        if (existingUser.provider && existingUser.provider !== 'credentials') {
          return NextResponse.json({ error: 'This account already uses SSO. Sign in with your provider instead.' }, { status: 409 })
        }

        const emailResponse = await EmailService.sendVerificationCode(email, name || email.split('@')[0], code);
        if (emailResponse && 'error' in emailResponse) {
          console.error('Failed to send verification email:', emailResponse.error);
          return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
        }

        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
            isVerified: false,
          },
        });

        await upsertVerification(user.id, code, expiresAt);

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
      } else {
        // Validate email
        // const validateEmail = await validate(email);
        // if (!validateEmail.valid) {
        //   return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        // }

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
            provider: 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
            isVerified: false,
          },
        });

        await upsertVerification(user.id, code, expiresAt);

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
          isVerified: user.isVerified ?? false,
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



