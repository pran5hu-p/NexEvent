import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

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
    // 1. Verify the user is logged in
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the user has the correct permissions
    if (token.role !== 'organizer' && token.role !== 'admin') {
      return NextResponse.json({ message: 'Only organizers can create events' }, { status: 403 });
    }

    // 3. Parse the incoming form data
    const body = await req.json();
    const { title, description, category, date, location, capacity, posterUrl, tags } = body;

    // Basic validation
    if (!title || !description || !category || !date || !location) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 4. Save the event to the PostgreSQL database
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        category,
        date: new Date(date), // Convert string to proper DateTime
        location,
        capacity: Number(capacity) || 0,
        posterUrl: posterUrl || null,
        tags: tags || [],
        status: 'pending', // Defaults to pending until an Admin approves it
        organizerId: token.id as string, // Tie the event to the user who created it
      },
    });

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ message: 'An error occurred while creating the event' }, { status: 500 });
  }
}