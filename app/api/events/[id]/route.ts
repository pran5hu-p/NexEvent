import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { updateEventSchema } from '@/lib/validations';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET: Fetch a single event by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return NextResponse.json({ message: 'Error fetching event' }, { status: 500 });
  }
}

// PATCH: Update an existing event
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find the existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // 2. Security Check: Only the owner or an admin can edit it
    if (existingEvent.organizerId !== token.id && token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: You can only edit your own events' }, { status: 403 });
    }

    // 3. Parse and validate the incoming updates using Zod
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 4. Save the safe updates directly from parsed data
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ message: 'Error updating event' }, { status: 500 });
  }
}

// DELETE: Remove an event
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.organizerId !== token.id && token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: You can only delete your own events' }, { status: 403 });
    }

    // 1. Delete any associated registrations first (safeguards against foreign key crashes)
    await prisma.registration.deleteMany({
      where: { eventId: id },
    });

    // 2. Now safe to delete the event
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ message: 'Error deleting event' }, { status: 500 });
  }
}