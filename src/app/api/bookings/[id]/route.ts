import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { format, differenceInHours } from 'date-fns';
import { sendBookingAcceptedEmail, sendBookingRejectedEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/bookings/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      property: {
        include: {
          images: { orderBy: { order: 'asc' } },
          amenities: { include: { amenity: true } },
          host: { select: { id: true, name: true, phone: true } },
        },
      },
      guest: { select: { id: true, name: true, email: true, phone: true } },
      host: { select: { id: true, name: true, email: true, phone: true } },
      review: true,
      hostReview: true,
    },
  });

  if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });

  // Only participants and admin can view
  const isParticipant = booking.guestId === session.userId || booking.hostId === session.userId;
  if (!isParticipant && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  // Hide host review of guest from the guest — only hosts can see it
  const isGuest = booking.guestId === session.userId && session.role !== 'ADMIN';
  if (isGuest) {
    (booking as any).hostReview = undefined;
  }

  return NextResponse.json({ booking });
}

// PATCH /api/bookings/[id] – update booking status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });

  const { status } = await req.json();

  // Host can accept/reject pending bookings
  if ((status === 'ACCEPTED' || status === 'REJECTED') && booking.hostId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Doar gazda poate modifica statusul' }, { status: 403 });
  }

  // Guest can cancel own bookings
  if (status === 'CANCELLED' && booking.guestId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Doar oaspetele poate anula' }, { status: 403 });
  }

  // Enforce cancellation policy for guest cancellations of accepted bookings
  if (status === 'CANCELLED' && booking.guestId === session.userId && booking.status === 'ACCEPTED') {
    const property = await prisma.property.findUnique({ where: { id: booking.propertyId }, select: { cancellationPolicy: true } });
    const hoursUntilCheckin = differenceInHours(booking.startDate, new Date());
    const policy = property?.cancellationPolicy || 'FLEXIBLE';

    if (policy === 'FLEXIBLE' && hoursUntilCheckin < 24) {
      return NextResponse.json({ error: 'Anularea gratuită este posibilă doar cu cel puțin 24 de ore înainte de check-in' }, { status: 400 });
    }
    if (policy === 'MODERATE' && hoursUntilCheckin < 5 * 24) {
      return NextResponse.json({ error: 'Anularea gratuită este posibilă doar cu cel puțin 5 zile înainte de check-in' }, { status: 400 });
    }
    if (policy === 'STRICT' && hoursUntilCheckin < 7 * 24) {
      return NextResponse.json({ error: 'Conform politicii stricte, anularea nu mai este posibilă cu mai puțin de 7 zile înainte de check-in' }, { status: 400 });
    }
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status },
    include: {
      guest: { select: { email: true, name: true } },
      property: { select: { title: true } },
    },
  });

  // In-app notifications
  if (status === 'ACCEPTED') {
    createNotification({
      userId: booking.guestId,
      type: 'BOOKING_ACCEPTED',
      title: 'Rezervare acceptată',
      message: `Rezervarea ta la ${updated.property.title} a fost acceptată!`,
      bookingId: booking.id,
    });
  } else if (status === 'REJECTED') {
    createNotification({
      userId: booking.guestId,
      type: 'BOOKING_REJECTED',
      title: 'Rezervare refuzată',
      message: `Rezervarea ta la ${updated.property.title} a fost refuzată.`,
      bookingId: booking.id,
    });
  } else if (status === 'CANCELLED') {
    createNotification({
      userId: booking.hostId,
      type: 'BOOKING_CANCELLED',
      title: 'Rezervare anulată',
      message: `O rezervare la ${updated.property.title} a fost anulată de oaspete.`,
      bookingId: booking.id,
    });
  }

  // Email notifications for accept/reject
  if (status === 'ACCEPTED') {
    sendBookingAcceptedEmail(
      updated.guest.email,
      updated.guest.name,
      updated.property.title,
      format(updated.startDate, 'dd.MM.yyyy'),
      format(updated.endDate, 'dd.MM.yyyy'),
    );
  } else if (status === 'REJECTED') {
    sendBookingRejectedEmail(
      updated.guest.email,
      updated.guest.name,
      updated.property.title,
      format(updated.startDate, 'dd.MM.yyyy'),
      format(updated.endDate, 'dd.MM.yyyy'),
    );
  }

  return NextResponse.json({ booking: updated });
}
