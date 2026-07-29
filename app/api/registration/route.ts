import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRegistrationSchema } from '@/lib/validations';
import { sendTicketConfirmationEmail } from '@/lib/email';
import { eventRegisterLimiter, getClientIp } from '@/lib/rateLimit';
import { emailQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    try {
      await eventRegisterLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Too many attempts, try again later' }, 
        { status: 429 }
      );
    }
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // 1. Validate that we received a proper eventId
    const validData = createRegistrationSchema.parse(body);

    // 2. Create the ticket attached to the current user
    const registration = await prisma.registration.create({
      data: {
        eventId: validData.eventId,
        userId: session.user.id,
        status: 'registered',
      },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true, date: true, location: true } }
      }
    });
    await emailQueue.add('ticket-confirmation', {
      to: registration.user.email,
      userName: registration.user.name,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      eventLocation: registration.event.location,
    });

    return NextResponse.json(registration, { status: 201 });
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Failed to register for event' }, { status: 500 });
  }
}