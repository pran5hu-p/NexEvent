import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Modern Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the registration ID from the request body
    const body = await req.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json({ message: 'Registration ID is required' }, { status: 400 });
    }

    // 3. Find the registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
    }

    // 4. Authorization Check (User owns it, OR user is an admin)
    if (registration.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: You cannot cancel this ticket' }, { status: 403 });
    }

    // 5. Safety Check: Don't allow cancelling if already checked in
    if (registration.status === 'checked_in') {
      return NextResponse.json({ message: 'Cannot cancel a ticket after you have checked in' }, { status: 400 });
    }

    // 6. Soft Delete (Update status to cancelled)
    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ message: 'Registration cancelled successfully', registration: updated }, { status: 200 });

  } catch (error) {
    console.error('Cancellation Error:', error);
    return NextResponse.json({ message: 'Failed to cancel registration' }, { status: 500 });
  }
}