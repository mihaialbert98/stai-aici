import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { reviewSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST /api/reviews – guest leaves a review after checkout
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { review: true },
    });

    if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });
    if (booking.guestId !== session.userId) return NextResponse.json({ error: 'Doar oaspetele poate lăsa o recenzie' }, { status: 403 });
    if (booking.status !== 'ACCEPTED') return NextResponse.json({ error: 'Poți lăsa o recenzie doar pentru rezervări acceptate' }, { status: 400 });
    if (new Date(booking.endDate) > new Date()) return NextResponse.json({ error: 'Poți lăsa o recenzie doar după checkout' }, { status: 400 });
    if (booking.review) return NextResponse.json({ error: 'Ai lăsat deja o recenzie' }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        guestId: session.userId,
        propertyId: booking.propertyId,
        rating: data.rating,
        comment: data.comment || null,
      },
    });

    // Notify host about new review
    createNotification({
      userId: booking.hostId,
      type: 'REVIEW_NEW',
      title: 'Recenzie nouă',
      message: `Ai primit o recenzie de ${data.rating} stele${data.comment ? `: "${data.comment.slice(0, 80)}${data.comment.length > 80 ? '...' : ''}"` : ''}`,
      bookingId: booking.id,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// GET /api/reviews?propertyId=xxx – get reviews for a property
export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get('propertyId');
  if (!propertyId) return NextResponse.json({ error: 'propertyId necesar' }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { propertyId },
    include: { guest: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const avg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length });
}
