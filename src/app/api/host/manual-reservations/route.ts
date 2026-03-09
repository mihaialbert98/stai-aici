import { NextRequest, NextResponse } from 'next/server';
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

  const body = await req.json();
  const { propertyId, guestName, checkIn, checkOut, revenue, source, notes, blockCalendar } = body;

  if (!propertyId || !checkIn || !checkOut || revenue == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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
      revenue: parseFloat(revenue),
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
