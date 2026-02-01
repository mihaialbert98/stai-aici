import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { messageSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/messages?bookingId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId necesar' }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });

  const isParticipant = booking.guestId === session.userId || booking.hostId === session.userId;
  if (!isParticipant && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { bookingId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ messages });
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  try {
    const body = await req.json();
    const data = messageSchema.parse(body);

    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
    if (!booking) return NextResponse.json({ error: 'Rezervare negăsită' }, { status: 404 });

    const isParticipant = booking.guestId === session.userId || booking.hostId === session.userId;
    if (!isParticipant && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

    // Determine message role
    let role: 'GUEST' | 'HOST' | 'ADMIN' = 'GUEST';
    if (session.role === 'ADMIN') role = 'ADMIN';
    else if (session.userId === booking.hostId) role = 'HOST';

    const message = await prisma.message.create({
      data: {
        bookingId: data.bookingId,
        senderId: session.userId,
        role,
        content: data.content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    // Notify other participants about new message
    const recipients = [booking.guestId, booking.hostId].filter(uid => uid !== session.userId);
    for (const recipientId of recipients) {
      createNotification({
        userId: recipientId,
        type: 'MESSAGE_NEW',
        title: 'Mesaj nou',
        message: `${message.sender.name}: ${data.content.slice(0, 100)}${data.content.length > 100 ? '...' : ''}`,
        bookingId: data.bookingId,
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
