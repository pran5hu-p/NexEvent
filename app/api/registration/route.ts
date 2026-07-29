import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRegistrationSchema } from '@/lib/validations';
import { eventRegisterLimiter, getClientIp } from '@/lib/rateLimit';
import { emailQueue } from '@/lib/queue';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Stops spam/bots)
    const ip = getClientIp(req);
    try {
      await eventRegisterLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Too many attempts, try again later' }, 
        { status: 429 }
      );
    }

    // 2. Secure Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 3. Validate Payload via Zod
    const body = await req.json();
    const validData = createRegistrationSchema.parse(body);
    const eventId = validData.eventId;

    // 4. Fetch Event & Check Capacity
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

    // 5. Prevent Double-Booking
    const existing = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing && existing.status !== 'cancelled') {
      return NextResponse.json({ message: 'Already registered' }, { status: 409 });
    }

    // 6. Create Registration (Upsert in case they previously cancelled and are re-registering)
    const registration = await prisma.registration.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: { status: 'registered' },
      create: { userId, eventId, status: 'registered' },
    });

    // 7. Generate Secure QR Code
    const qrPayload = JSON.stringify({ registrationId: registration.id, eventId });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    // 8. Save QR Code & grab relational data for the email
    const finalRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: { qrCodeDataUrl },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true, date: true, location: true } }
      }
    });

    // 9. Fire Background Queue Email (Zero-Wait)
    if (finalRegistration.user?.email) {
      await emailQueue.add('ticket-confirmation', {
        to: finalRegistration.user.email,
        userName: finalRegistration.user.name,
        eventTitle: finalRegistration.event.title,
        eventDate: finalRegistration.event.date,
        eventLocation: finalRegistration.event.location,
      });
    }

    // 10. Return instant success to frontend
    return NextResponse.json(finalRegistration, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error('Registration Error:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}