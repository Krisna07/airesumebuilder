import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    let user
    const { email, name, image, provider, providerId, password, } = await req.json();
    // console.log(email, name, image, provider, providerId, password)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    // console.log(existingUser)
    //logic for the user with oauth login already exists
    if (!existingUser && provider !== 'credentials') {
      user = await prisma.user.create({
        data: {
          email: email,
          name: name || email.split('@')[0],
          image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
          provider: provider || 'credentials',
          providerId: providerId || null
        },
      });
    }

    if (existingUser && provider !== 'credentials') {
      user = await prisma.user.update({
        where: { email: email },
        data: {
          email: email,
          name: name || email.split('@')[0],
          image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
          provider: provider || 'credentials',
          providerId: providerId || null
        },
      });
    }

    //logic for the user with credentials signup
    if (provider === 'credentials') {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (existingUser && existingUser.password) {
        return NextResponse.json({ error: 'User already exists.' }, { status: 409 })
      }

      if (existingUser && !existingUser.password) {
        user = await prisma.user.update({
          where: { email: email },
          data: {
            email: email,
            name: name || email.split('@')[0],
            image: image ? image : `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            password: hashedPassword
          },
        });

      } else {
        if (!email || !password) {
          return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

      // Create the user
        user = await prisma.user.create({
          data: {
            email: email,
            name: name || email.split('@')[0],
            image: image ? image : `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            password: hashedPassword
          },
        });
      }


    }
    if (user) {
      return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name, image: user.image, provider: user.provider, providerId: user.providerId } }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User creation failed.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}



