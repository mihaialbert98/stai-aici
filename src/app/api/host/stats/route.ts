import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const propertyIds = searchParams.get('propertyIds'); // comma-separated

  const now = new Date();
  const periodStart = from ? new Date(from) : startOfMonth(now);
  const periodEnd = to ? new Date(to) : endOfMonth(now);

  const propertyFilter = propertyIds
    ? { in: propertyIds.split(',') }
    : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      hostId: session.userId,
      status: 'ACCEPTED',
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
    },
  });

  const hostProperties = await prisma.property.findMany({
    where: { hostId: session.userId, isActive: true, ...(propertyFilter ? { id: propertyFilter } : {}) },
    select: { id: true },
  });
  const hostPropertyIds = hostProperties.map(p => p.id);

  const [manualReservations, syncedReservations] = await Promise.all([
    prisma.manualReservation.findMany({
      where: {
        hostId: session.userId,
        checkIn: { lte: periodEnd },
        checkOut: { gte: periodStart },
        ...(propertyFilter ? { propertyId: propertyFilter } : {}),
      },
    }),
    hostPropertyIds.length > 0 ? prisma.syncedReservation.findMany({
      where: {
        propertyId: { in: hostPropertyIds },
        isBlock: false,
        checkIn: { lte: periodEnd },
        checkOut: { gte: periodStart },
      },
    }) : Promise.resolve([]),
  ]);

  const totalBookings = bookings.length + manualReservations.length + syncedReservations.length;
  const totalNights = bookings.reduce((sum, b) => sum + differenceInDays(b.endDate, b.startDate), 0)
    + manualReservations.reduce((sum, r) => sum + differenceInDays(r.checkOut, r.checkIn), 0)
    + syncedReservations.reduce((sum, r) => sum + differenceInDays(r.checkOut, r.checkIn) + 1, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
    + manualReservations.reduce((sum, r) => sum + r.revenue, 0)
    + syncedReservations.reduce((sum, r) => sum + r.revenue, 0);

  const propertyCount = hostPropertyIds.length;
  const periodDays = Math.max(differenceInDays(periodEnd, periodStart), 1);
  const totalPropertyDays = propertyCount * periodDays;
  const occupancyRate = totalPropertyDays > 0 ? Math.round((totalNights / totalPropertyDays) * 100) : 0;

  const reviews = await prisma.review.findMany({
    where: {
      property: {
        hostId: session.userId,
        ...(propertyFilter ? { id: propertyFilter } : {}),
      },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { rating: true },
  });
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  const pendingCount = await prisma.booking.count({
    where: {
      hostId: session.userId,
      status: 'PENDING',
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
    },
  });

  return NextResponse.json({
    totalBookings,
    totalNights,
    totalRevenue,
    occupancyRate,
    avgRating,
    reviewCount: reviews.length,
    pendingCount,
  });
  } catch (err) {
    console.error('[stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
