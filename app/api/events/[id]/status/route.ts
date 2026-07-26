import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // SECURITY: Only allow admins to hit this route
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }

  try {
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('Status update failed:', error);
    return NextResponse.json({ message: 'Failed to update event' }, { status: 500 });
  }
}