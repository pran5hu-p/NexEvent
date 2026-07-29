import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { createEventSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventCreateLimiter, getClientIp } from '@/lib/rateLimit';

// GET: Fetch all approved events for the public homepage
export async function GET(req: NextRequest) {
  try {
    // We only want to show events that an Admin has approved
    const events = await prisma.event.findMany({
      where: {
        status: 'approved', 
      },
      include: {
        organizer: {
          select: { name: true, avatarUrl: true }, // Only grab public info
        },
      },
      orderBy: {
        date: 'asc', // Show closest upcoming events first
      },
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST: Create a new event (Protected Route)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    try {
      await eventCreateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Event creation limit reached. You can only create 5 events per hour.' }, 
        { status: 429 }
      );
    }
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify permissions
    if (session.user.role !== 'organizer' && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Only organizers can create events' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        ...parsed.data,
        status: 'pending', 
        organizerId: session.user.id, 
      },
    });

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ message: 'An error occurred while creating the event' }, { status: 500 });
  }
}