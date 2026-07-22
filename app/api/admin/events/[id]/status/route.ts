import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedEvent, { status: 200 });

  } catch (error) {
    console.error('Failed to update event status:', error);
    return NextResponse.json({ message: 'Error updating event status' }, { status: 500 });
  }
}