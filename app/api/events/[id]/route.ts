import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
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

    // 3. Parse and format the incoming updates
    const body = await req.json();
    
    // Explicitly define the fields an Organizer is allowed to update
    const updateData: any = {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.category && { category: body.category }),
      ...(body.location && { location: body.location }),
      ...(body.posterUrl && { posterUrl: body.posterUrl }),
      ...(body.tags && { tags: body.tags }),
    };

    // Handle the type conversions safely
    if (body.date) {
      updateData.date = new Date(body.date);
    }
    if (body.capacity) {
      updateData.capacity = Number(body.capacity);
    }

    // 4. Save the safe updates
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData, // Pass the safe object instead of the raw body
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

    // Security Check: Only the owner or an admin can delete it
    if (existingEvent.organizerId !== token.id && token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: You can only delete your own events' }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ message: 'Error deleting event' }, { status: 500 });
  }
}