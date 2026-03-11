import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  guestName: z.string().nullable().optional(),
  revenue: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  isBlockManual: z.boolean().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reservation = await prisma.syncedReservation.findUnique({
    where: { id: params.id },
    include: { property: { select: { hostId: true } } },
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (reservation.property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { guestName, revenue, notes, isBlockManual } = parsed.data;

  const updated = await prisma.syncedReservation.update({
    where: { id: params.id },
    data: {
      ...(guestName !== undefined && { guestName: guestName || null }),
      ...(revenue !== undefined && { revenue }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(isBlockManual !== undefined && {
        isBlockManual,
        // Apply the override to isBlock immediately so the UI reflects it without re-sync
        ...(isBlockManual !== null && { isBlock: isBlockManual }),
      }),
    },
  });

  return NextResponse.json(updated);
}
