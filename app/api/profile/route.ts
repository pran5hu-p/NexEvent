import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl } = await req.json(); // Changed from image to avatarUrl

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Name cannot be empty' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl || null, // Changed from image to avatarUrl
      },
    });

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}