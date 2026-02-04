import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/calendar — returns all data the calendar page needs in one query
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const properties = await prisma.property.findMany({
    where: { hostId: session.userId, isActive: true },
    select: {
      id: true,
      title: true,
      pricePerNight: true,
      images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
      blockedDates: { select: { date: true, source: true } },
      calendarSyncs: { orderBy: { createdAt: 'desc' } },
      periodPricings: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          pricePerNight: true,
        },
        orderBy: { startDate: 'asc' },
      },
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      hostId: session.userId,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      totalPrice: true,
      guests: true,
      guest: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } } },
    },
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json({ properties, bookings });
}
