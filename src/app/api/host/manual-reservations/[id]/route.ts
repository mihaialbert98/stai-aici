import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { eachDayOfInterval, subDays } from 'date-fns';

/** Returns all dates from checkIn up to (but not including) checkOut */
function stayDates(checkIn: Date, checkOut: Date): Date[] {
  const last = subDays(checkOut, 1);
  if (last < checkIn) return [];
  return eachDayOfInterval({ start: checkIn, end: last });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const existing = await prisma.manualReservation.findFirst({
    where: { id: params.id, hostId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { guestName, checkIn, checkOut, revenue, source, notes, propertyId, blockCalendar } = body;

  if (propertyId && propertyId !== existing.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, hostId: session.userId },
    });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const newCheckIn = checkIn ? new Date(checkIn) : existing.checkIn;
  const newCheckOut = checkOut ? new Date(checkOut) : existing.checkOut;
  const newPropertyId = propertyId || existing.propertyId;
  const newBlockCalendar = blockCalendar !== undefined ? blockCalendar : existing.blockCalendar;

  const reservation = await prisma.manualReservation.update({
    where: { id: params.id },
    data: {
      ...(propertyId ? { propertyId } : {}),
      guestName: guestName !== undefined ? (guestName || null) : undefined,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      ...(revenue != null ? { revenue: parseFloat(revenue) } : {}),
      source: source !== undefined ? (source || null) : undefined,
      notes: notes !== undefined ? (notes || null) : undefined,
      blockCalendar: newBlockCalendar,
    },
    include: { property: { select: { id: true, title: true } } },
  });

  // Remove old blocked dates for this reservation, then re-create if needed
  await prisma.blockedDate.deleteMany({
    where: { source: `external:${params.id}` },
  });

  if (newBlockCalendar) {
    const dates = stayDates(newCheckIn, newCheckOut);
    if (dates.length > 0) {
      await prisma.blockedDate.createMany({
        data: dates.map(d => ({
          propertyId: newPropertyId,
          date: d,
          source: `external:${params.id}`,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ reservation });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const existing = await prisma.manualReservation.findFirst({
    where: { id: params.id, hostId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Remove associated blocked dates
  await prisma.blockedDate.deleteMany({
    where: { source: `external:${params.id}` },
  });

  await prisma.manualReservation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
