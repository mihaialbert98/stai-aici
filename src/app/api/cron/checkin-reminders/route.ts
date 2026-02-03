import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { sendCheckInReminderEmail } from '@/lib/email';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

// GET /api/cron/checkin-reminders — called daily by Vercel Cron
// Finds accepted bookings with check-in tomorrow, sends reminder
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // Tomorrow at midnight
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // Find accepted bookings with check-in tomorrow
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'ACCEPTED',
      startDate: { gte: tomorrow, lt: dayAfter },
    },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      host: { select: { name: true, phone: true } },
      property: { select: { title: true, address: true, city: true, checkInInfo: true } },
    },
  });

  let sent = 0;

  for (const booking of bookings) {
    // Check if we already sent a check-in reminder for this booking
    const existing = await prisma.notification.findFirst({
      where: {
        userId: booking.guestId,
        bookingId: booking.id,
        title: { contains: 'Check-in' },
      },
    });
    if (existing) continue;

    const checkInDateStr = format(booking.startDate, 'd MMMM yyyy', { locale: ro });

    // Send notification
    await createNotification({
      userId: booking.guestId,
      type: 'BOOKING_ACCEPTED', // reusing type, message makes it clear
      title: 'Check-in maine!',
      message: `Nu uita: maine ai check-in la ${booking.property.title}. Verifica detaliile rezervarii.`,
      bookingId: booking.id,
    });

    // Send email
    sendCheckInReminderEmail(
      booking.guest.email,
      booking.guest.name,
      booking.property.title,
      `${booking.property.address}, ${booking.property.city}`,
      checkInDateStr,
      booking.host.name,
      booking.host.phone,
      booking.property.checkInInfo,
      booking.id,
    );

    sent++;
  }

  return NextResponse.json({ ok: true, sent, checked: bookings.length });
}
