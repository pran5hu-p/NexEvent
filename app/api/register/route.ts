import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, role } = body;

    // 1. Validate incoming data
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Check if the user already exists in Postgres
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // 3. Hash the password securely using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save the new user to the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'customer',
      },
    });

    // 5. Return success (without sending the password back)
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: { id: newUser.id, email: newUser.email, role: newUser.role } 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}