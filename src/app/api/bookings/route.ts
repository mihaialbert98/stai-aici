import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { bookingSchema } from '@/lib/validations';
import { differenceInDays, eachDayOfInterval, parseISO, format } from 'date-fns';
import { sendBookingRequestEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/bookings – get user's bookings
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const role = searchParams.get('role') || 'guest'; // guest | host
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  const where = role === 'host'
    ? { hostId: session.userId }
    : { guestId: session.userId };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        property: { include: { images: { take: 1, orderBy: { order: 'asc' } } } },
        guest: { select: { id: true, name: true, email: true } },
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({ bookings, total, pages: Math.ceil(total / limit) });
}

// POST /api/bookings – guest creates booking request
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property || !property.isActive) {
      return NextResponse.json({ error: 'Proprietate indisponibilă' }, { status: 400 });
    }
    if (data.guests > property.maxGuests) {
      return NextResponse.json({ error: `Maxim ${property.maxGuests} oaspeți` }, { status: 400 });
    }

    const startDate = parseISO(data.startDate);
    const endDate = parseISO(data.endDate);
    const nights = differenceInDays(endDate, startDate);
    if (nights < 1) {
      return NextResponse.json({ error: 'Minim 1 noapte' }, { status: 400 });
    }

    // Check for blocked dates and existing bookings
    const requestedDays = eachDayOfInterval({ start: startDate, end: endDate });
    const blocked = await prisma.blockedDate.findMany({
      where: { propertyId: data.propertyId, date: { in: requestedDays } },
    });
    if (blocked.length > 0) {
      return NextResponse.json({ error: 'Unele date sunt blocate' }, { status: 400 });
    }

    const overlapping = await prisma.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [
          { startDate: { lt: endDate }, endDate: { gt: startDate } },
        ],
      },
    });
    if (overlapping) {
      return NextResponse.json({ error: 'Perioada se suprapune cu o altă rezervare' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        guestId: session.userId,
        hostId: property.hostId,
        startDate,
        endDate,
        guests: data.guests,
        totalPrice: nights * property.pricePerNight,
      },
      include: { property: true, host: { select: { email: true, name: true } }, guest: { select: { name: true } } },
    });

    // Notify host about new booking request
    createNotification({
      userId: property.hostId,
      type: 'BOOKING_NEW',
      title: 'Cerere nouă de rezervare',
      message: `${booking.guest.name} a solicitat o rezervare la ${property.title} (${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')})`,
      bookingId: booking.id,
    });

    // Email notification to host
    sendBookingRequestEmail(
      booking.host.email,
      booking.host.name,
      booking.guest.name,
      property.title,
      format(startDate, 'dd.MM.yyyy'),
      format(endDate, 'dd.MM.yyyy'),
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
