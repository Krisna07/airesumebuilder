import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email and password are required.',
          status: 400
        }
      );
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          status: 409,
          error: 'User already exists.'
        }
      )
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    return NextResponse.json({
      data: { id: user.id, email: user.email, name: user.name },
      status: 200
    });
  } catch (error) {
    return NextResponse.json({
      error: JSON.stringify(error),
      status: 500
    });
  }
}
