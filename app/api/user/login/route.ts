import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({
        status: 400,
        error: 'Email and password are required.'
      });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({
        status: 401,
        error: 'User not found, please register.'
      });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        {
          status: 401,
          error: 'Invalid credentials.'
        }
      );
    }
    return NextResponse.json({
      status: 200,
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: JSON.stringify(error),
      status: 500
    });
  }
}
