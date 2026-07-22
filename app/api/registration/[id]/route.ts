import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
    }

    if (registration.userId !== token.id && token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: You cannot cancel this ticket' }, { status: 403 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ message: 'Registration cancelled successfully', registration: updated }, { status: 200 });

  } catch (error) {
    console.error('Cancel Error:', error);
    return NextResponse.json({ message: 'Failed to cancel registration' }, { status: 500 });
  }
}