import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateEventStatusSchema } from '@/lib/validations';
import { emailQueue } from '@/lib/queue';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validData = updateEventStatusSchema.parse(body);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: validData,
      include: {
        organizer: { select: { email: true, name: true } },
      },
    });

    // 1. Send immediate status update to the organizer
    if (updatedEvent.organizer?.email) {
      await emailQueue.add('event-status', {
        to: updatedEvent.organizer.email,
        eventTitle: updatedEvent.title,
        status: updatedEvent.status,
      });
    }

    // 2. Schedule the bulk reminder for attendees IF the event was just approved
    if (updatedEvent.status === 'approved') {
      // Calculate milliseconds until 24 hours before the event starts
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const timeUntilReminder = new Date(updatedEvent.date).getTime() - ONE_DAY_MS - Date.now();

      // Only schedule it if the event is actually more than 24 hours away
      if (timeUntilReminder > 0) {
        await emailQueue.add(
          'event-reminder',
          { eventId: updatedEvent.id, eventTitle: updatedEvent.title },
          { 
            delay: timeUntilReminder, 
            jobId: `reminder-${updatedEvent.id}` // Giving it a custom ID prevents duplicate schedules
          }
        );
      }
    }

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error('Status update failed:', error);
    return NextResponse.json({ message: 'Failed to update event status' }, { status: 500 });
  }
}