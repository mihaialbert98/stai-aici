import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/guest-profile – get current guest's profile with bookings and reviews
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const now = new Date();

  const [upcomingBookings, pastBookings, myReviews, hostReviews] = await Promise.all([
    // Upcoming: PENDING or ACCEPTED with endDate in the future
    prisma.booking.findMany({
      where: {
        guestId: session.userId,
        endDate: { gt: now },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        property: { include: { images: { take: 1, orderBy: { order: 'asc' } } } },
      },
      orderBy: { startDate: 'asc' },
    }),
    // Past: endDate in the past OR cancelled/rejected
    prisma.booking.findMany({
      where: {
        guestId: session.userId,
        OR: [
          { endDate: { lte: now } },
          { status: { in: ['CANCELLED', 'REJECTED'] } },
        ],
      },
      include: {
        property: { include: { images: { take: 1, orderBy: { order: 'asc' } } } },
        review: { select: { id: true, rating: true, comment: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 20,
    }),
    // Reviews the guest has left on properties
    prisma.review.findMany({
      where: { guestId: session.userId },
      include: {
        property: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Host reviews about this guest (guest can see their own rating)
    prisma.hostReview.findMany({
      where: { guestId: session.userId },
      include: {
        host: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const guestAvg = hostReviews.length > 0
    ? Math.round((hostReviews.reduce((s, r) => s + r.rating, 0) / hostReviews.length) * 10) / 10
    : null;

  return NextResponse.json({
    upcomingBookings,
    pastBookings,
    myReviews,
    hostReviews,
    guestRating: guestAvg,
    guestReviewCount: hostReviews.length,
  });
}
