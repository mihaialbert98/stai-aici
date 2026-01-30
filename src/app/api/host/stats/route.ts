import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const bookingsThisMonth = await prisma.booking.findMany({
    where: {
      hostId: session.userId,
      status: 'ACCEPTED',
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
  });

  const totalBookings = bookingsThisMonth.length;
  const totalNights = bookingsThisMonth.reduce((sum, b) => sum + differenceInDays(b.endDate, b.startDate), 0);
  const totalRevenue = bookingsThisMonth.reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingCount = await prisma.booking.count({
    where: { hostId: session.userId, status: 'PENDING' },
  });

  return NextResponse.json({ totalBookings, totalNights, totalRevenue, pendingCount });
}
