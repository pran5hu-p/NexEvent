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

    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ message: 'Registration ID is required' }, { status: 400 });
    }

    // Find the registration and ensure it belongs to the logged-in user
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.userId !== session.user.id) {
      return NextResponse.json({ message: 'Ticket not found or unauthorized' }, { status: 404 });
    }

    if (registration.status === 'checked_in') {
      return NextResponse.json({ message: 'Cannot cancel a ticket after you have checked in' }, { status: 400 });
    }

    // Delete the registration record (frees up space for capacity counts)
    await prisma.registration.delete({
      where: { id: registrationId },
    });

    return NextResponse.json({ message: 'Ticket successfully cancelled' }, { status: 200 });

  } catch (error) {
    console.error('Cancellation Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}