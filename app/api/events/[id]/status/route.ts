import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateEventStatusSchema } from '@/lib/validations';

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

    // 1. Zod safely parses the status
    const validData = updateEventStatusSchema.parse(body);

    // 2. We inject the safely validated data directly
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: validData, 
    });

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error('Status update failed:', error);
    return NextResponse.json({ message: 'Failed to update event status' }, { status: 500 });
  }
}