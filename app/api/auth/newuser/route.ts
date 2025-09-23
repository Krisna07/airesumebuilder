import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, image, provider, providerId } = await req.json();
    if ((!email || !password) && !provider) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 409 })
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
        provider: provider || 'credentials',
        providerId: providerId || null,
      },
    });
    return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
