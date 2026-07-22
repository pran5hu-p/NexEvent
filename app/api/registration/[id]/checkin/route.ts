import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || (token.role !== 'organizer' && token.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!registration || (registration.event.organizerId !== token.id && token.role !== 'admin')) {
      return NextResponse.json({ message: 'Not found or unauthorized' }, { status: 404 });
    }

    if (registration.status === 'attended') {
      return NextResponse.json({ message: 'Already checked in' }, { status: 409 });
    }
    
    if (registration.status === 'cancelled') {
      return NextResponse.json({ message: 'Ticket was cancelled' }, { status: 400 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'attended', checkedInAt: new Date() },
    });

    return NextResponse.json({ registration: updated }, { status: 200 });

  } catch (error) {
    console.error('Check-in Error:', error);
    return NextResponse.json({ message: 'Check-in failed' }, { status: 500 });
  }
}