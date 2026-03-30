import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const property = await prisma.property.findFirst({
    where: { id: params.id, hostId: session.userId },
    select: { id: true, guestCapacity: true },
  });
  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const link = await prisma.guestFormLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id, activeGuestCount: property.guestCapacity },
    update: {},
  });

  return NextResponse.json({ link });
}

const patchSchema = z.object({
  activeGuestCount: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
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
    select: { id: true, guestCapacity: true },
  });
  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  if (
    parsed.data.activeGuestCount !== undefined &&
    parsed.data.activeGuestCount > property.guestCapacity
  ) {
    return NextResponse.json(
      { error: `activeGuestCount cannot exceed guestCapacity (${property.guestCapacity})` },
      { status: 400 }
    );
  }

  const link = await prisma.guestFormLink.upsert({
    where: { propertyId: params.id },
    create: {
      propertyId: params.id,
      activeGuestCount: parsed.data.activeGuestCount ?? property.guestCapacity,
      isActive: parsed.data.isActive ?? true,
    },
    update: {
      ...(parsed.data.activeGuestCount !== undefined && {
        activeGuestCount: parsed.data.activeGuestCount,
      }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  return NextResponse.json({ link });
}
