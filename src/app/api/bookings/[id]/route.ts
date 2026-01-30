import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
    },
  });

  if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });

  // Only participants and admin can view
  const isParticipant = booking.guestId === session.userId || booking.hostId === session.userId;
  if (!isParticipant && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
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

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ booking: updated });
}
