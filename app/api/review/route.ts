import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createReviewSchema } from '@/lib/validations';
import { getClientIp, reviewLimiter } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    try {
      await reviewLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Too many reviews submitted. Please try again later.' }, 
        { status: 429 }
      );
    }
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Zod Validation (Replaces manual if(!eventId || !rating...) checks)
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { eventId, rating, comment } = parsed.data;

    // 2. Event Validation (Ensures event exists and is in the past)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (new Date(event.date) > new Date()) {
      return NextResponse.json({ message: 'You can only review completed events' }, { status: 400 });
    }

    // 3. Duplicate Prevention
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

    // 4. Create the Review
    const newReview = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || "", 
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