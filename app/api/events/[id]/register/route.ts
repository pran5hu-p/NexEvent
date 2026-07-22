import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import QRCode from 'qrcode';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ message: 'Please log in to register' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        _count: { 
          select: { registrations: { where: { status: { not: 'cancelled' } } } } 
        } 
      },
    });

    if (!event || event.status !== 'approved') {
      return NextResponse.json({ message: 'Event not available' }, { status: 404 });
    }

    if (event._count.registrations >= event.capacity) {
      return NextResponse.json({ message: 'Event is full' }, { status: 409 });
    }

    const existing = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: token.id as string, eventId } },
    });

    if (existing && existing.status !== 'cancelled') {
      return NextResponse.json({ message: 'Already registered' }, { status: 409 });
    }
    const registration = await prisma.registration.upsert({
      where: { userId_eventId: { userId: token.id as string, eventId } },
      update: { status: 'registered' },
      create: { userId: token.id as string, eventId, status: 'registered' },
    });

    const qrPayload = JSON.stringify({ registrationId: registration.id, eventId });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { qrCodeDataUrl },
    });

    return NextResponse.json({ registration: updated }, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}