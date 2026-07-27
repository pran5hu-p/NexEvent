import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log("--> 1. Check-in hit for registration ID:", id);

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("--> 2. Token resolved:", token ? { id: token.id, role: token.role } : "NO TOKEN");

    if (!token || (token.role !== 'organizer' && token.role !== 'admin')) {
      console.log("--> ERROR: Unauthorized role");
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { 
        event: true,
        user: { select: { name: true, email: true } }
      },
    });

    console.log("--> 3. Registration found in DB:", registration ? registration.id : "NOT FOUND");

    if (!registration || (registration.event.organizerId !== token.id && token.role !== 'admin')) {
      console.log("--> ERROR: Not found or unauthorized organizer");
      return NextResponse.json({ message: 'Not found or unauthorized' }, { status: 404 });
    }

    if (registration.status === 'attended' || registration.status === 'checked_in') {
      console.log("--> ERROR: Already checked in");
      return NextResponse.json({ 
        message: 'Already checked in', 
        attendeeName: registration.user?.name || 'Attendee' 
      }, { status: 409 });
    }
    
    if (registration.status === 'cancelled') {
      console.log("--> ERROR: Ticket cancelled");
      return NextResponse.json({ message: 'Ticket was cancelled' }, { status: 400 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'checked_in', checkedInAt: new Date() },
      include: { user: { select: { name: true } } }
    });

    console.log("--> 4. Successfully updated registration status!");

    return NextResponse.json({ 
      message: 'Check-in successful',
      registration: updated,
      attendeeName: updated.user?.name || 'Attendee'
    }, { status: 200 });

  } catch (error: any) {
    console.error('--> CRITICAL CHECK-IN ERROR CRASH:', error);
    return NextResponse.json({ message: error.message || 'Check-in failed' }, { status: 500 });
  }
}