import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found, please register.' },
        { status: 401 }
      );
    }
    const dbPassword = user.password;
    if(!dbPassword) {
      return NextResponse.json(
        { error: 'User has no password set, please use OAuth login.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, dbPassword);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { data: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({
      error: JSON.stringify(error)
    },
      {
        status: 500
    });
  }
}
