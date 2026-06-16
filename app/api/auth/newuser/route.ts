import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getEmailError, getPasswordError } from '@/lib/validations';
import { EmailService } from '@/utils/sendEmail';

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

    // Validate email - return specific error messages
    const emailError = getEmailError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // Check for existing user BEFORE any validation or creation
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // OAuth user creation or update (skip password validation)
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
      // Validate password - return specific error messages
      const passwordError = getPasswordError(password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }

      // Check for existing user with same email for credentials provider
      if (existingUser) {
        if (existingUser.password) {
          return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }
        // Existing user without password - OAuth user trying to add credentials
        // Continue with password setup for existing OAuth user
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      // Set ttl to 15 days from creation for unverified account expiration (Requirement 1.5)
      const ttl = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      if (existingUser) {
      // OAuth user adding credentials - update existing record
      // First create user with ttl, then send email
        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
            isVerified: false,
            ttl: ttl,
          },
        });
      } else {
        // Create new user with credentials and ttl
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            image: image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: 'credentials',
            providerId: providerId || null,
            password: hashedPassword,
            isVerified: false,
            ttl: ttl,
          },
        });
      }

      // Send verification email after successful user creation (Requirement 1.7)
      const emailResponse = await EmailService.sendVerificationCode(email, name || email.split('@')[0], code);

      // If email fails, rollback by deleting the user (Requirement 1.8)
      if (emailResponse && 'error' in emailResponse) {
        console.error('Failed to send verification email:', emailResponse.error);
        await prisma.user.delete({ where: { id: user!.id } });
        return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
      }

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



