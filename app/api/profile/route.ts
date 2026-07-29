import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIp, profileUpdateLimiter } from '@/lib/rateLimit';
import { updateUserSchema } from '@/lib/validations';

export async function PATCH(req: Request) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(req);
    try {
      await profileUpdateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Too many profile updates. Please wait a minute.' }, 
        { status: 429 }
      );
    }

    // 2. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 3. Zod Validation (Replaces manual name checking)
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 4. Update Database safely
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data, 
    });

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}