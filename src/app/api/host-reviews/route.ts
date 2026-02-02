import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const hostReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// POST /api/host-reviews – host leaves a review for a guest
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  try {
    const body = await req.json();
    const data = hostReviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { hostReview: true },
    });

    if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });
    if (booking.hostId !== session.userId) return NextResponse.json({ error: 'Doar gazda poate lăsa o recenzie pentru oaspete' }, { status: 403 });
    if (booking.status !== 'ACCEPTED') return NextResponse.json({ error: 'Poți lăsa o recenzie doar pentru rezervări acceptate' }, { status: 400 });
    if (new Date(booking.endDate) > new Date()) return NextResponse.json({ error: 'Poți lăsa o recenzie doar după checkout' }, { status: 400 });
    if (booking.hostReview) return NextResponse.json({ error: 'Ai lăsat deja o recenzie pentru acest oaspete' }, { status: 400 });

    const review = await prisma.hostReview.create({
      data: {
        bookingId: data.bookingId,
        hostId: session.userId,
        guestId: booking.guestId,
        rating: data.rating,
        comment: data.comment || null,
      },
    });

    createNotification({
      userId: booking.guestId,
      type: 'REVIEW_NEW',
      title: 'Recenzie de la gazdă',
      message: `Gazda ți-a lăsat o recenzie de ${data.rating} stele${data.comment ? `: "${data.comment.slice(0, 80)}${data.comment.length > 80 ? '...' : ''}"` : ''}`,
      bookingId: booking.id,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// GET /api/host-reviews?guestId=xxx – get host reviews for a guest (hosts only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  if (session.role !== 'HOST' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const guestId = req.nextUrl.searchParams.get('guestId');
  if (!guestId) return NextResponse.json({ error: 'guestId necesar' }, { status: 400 });

  const reviews = await prisma.hostReview.findMany({
    where: { guestId },
    include: { host: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const avg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length });
}
