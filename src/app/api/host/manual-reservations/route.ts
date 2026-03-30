import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { eachDayOfInterval, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/** Returns all dates from checkIn up to (but not including) checkOut */
function stayDates(checkIn: Date, checkOut: Date): Date[] {
  const last = subDays(checkOut, 1);
  if (last < checkIn) return [];
  return eachDayOfInterval({ start: checkIn, end: last });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get('propertyId');

  const reservations = await prisma.manualReservation.findMany({
    where: {
      hostId: session.userId,
      ...(propertyId ? { propertyId } : {}),
    },
    include: { property: { select: { id: true, title: true } } },
    orderBy: { checkIn: 'desc' },
  });

  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const createSchema = z.object({
    propertyId:    z.string().min(1),
    checkIn:       z.string().min(1),
    checkOut:      z.string().min(1),
    revenue:       z.number().min(0),
    guestName:     z.string().max(200).default(''),
    source:        z.string().max(100).default(''),
    notes:         z.string().max(1000).default(''),
    blockCalendar: z.boolean().optional(),
  });

  const rawBody = await req.json();
  const parsed = createSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }

  const { propertyId, guestName, checkIn, checkOut, revenue, source, notes, blockCalendar } = parsed.data;

  // Verify property belongs to this host
  const property = await prisma.property.findFirst({
    where: { id: propertyId, hostId: session.userId },
  });
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const shouldBlock = blockCalendar !== false;

  const reservation = await prisma.manualReservation.create({
    data: {
      propertyId,
      hostId: session.userId,
      guestName: guestName || null,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      revenue,
      source: source || null,
      notes: notes || null,
      blockCalendar: shouldBlock,
    },
    include: { property: { select: { id: true, title: true } } },
  });

  if (shouldBlock) {
    const dates = stayDates(checkInDate, checkOutDate);
    if (dates.length > 0) {
      await prisma.blockedDate.createMany({
        data: dates.map(d => ({
          propertyId,
          date: d,
          source: `external:${reservation.id}`,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ reservation });
}
