import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  guestCapacity: z.number().int().min(1).max(50),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const property = await prisma.property.findFirst({
    where: { id: params.id, hostId: session.userId },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { guestCapacity: parsed.data.guestCapacity },
    select: { id: true, guestCapacity: true },
  });

  await prisma.guestFormLink.updateMany({
    where: { propertyId: params.id },
    data: { activeGuestCount: parsed.data.guestCapacity },
  });

  return NextResponse.json({ guestCapacity: updated.guestCapacity });
}
