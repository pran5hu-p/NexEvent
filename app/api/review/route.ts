import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, rating, comment } = await req.json();

    if (!eventId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Invalid rating or missing event data' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Ensure the event is in the past before allowing a review
    if (new Date(event.date) > new Date()) {
      return NextResponse.json({ message: 'You can only review completed events' }, { status: 400 });
    }

    // Check if the user already submitted a review
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ message: 'You have already reviewed this event' }, { status: 400 });
    }

    // Create the review
    const newReview = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || "", // Matches your String? @default("")
        userId: session.user.id,
        eventId,
      },
    });

    return NextResponse.json({ message: 'Review submitted successfully', review: newReview }, { status: 201 });

  } catch (error) {
    console.error('Review API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}