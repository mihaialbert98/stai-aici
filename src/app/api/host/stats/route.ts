import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const totalBookings = bookings.length;
  const totalNights = bookings.reduce((sum, b) => sum + differenceInDays(b.endDate, b.startDate), 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const propertyCount = await prisma.property.count({
    where: {
      hostId: session.userId,
      isActive: true,
      ...(propertyFilter ? { id: propertyFilter } : {}),
    },
  });
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
}
