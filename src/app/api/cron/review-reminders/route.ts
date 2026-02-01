import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { sendReviewReminderEmail } from '@/lib/email';

// GET /api/cron/review-reminders — called daily by Vercel Cron
// Finds accepted bookings that ended yesterday with no review, sends reminder
export async function GET(req: NextRequest) {
  // Simple auth: check for CRON_SECRET or allow in dev
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  // Find accepted bookings that ended yesterday, with no review
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'ACCEPTED',
      endDate: { gte: yesterday, lt: today },
      review: null,
    },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      property: { select: { title: true } },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let sent = 0;

  for (const booking of bookings) {
    // Check if we already sent a reminder for this booking
    const existing = await prisma.notification.findFirst({
      where: {
        userId: booking.guestId,
        bookingId: booking.id,
        type: 'REVIEW_REMINDER',
      },
    });
    if (existing) continue;

    // Send notification
    await createNotification({
      userId: booking.guestId,
      type: 'REVIEW_REMINDER',
      title: 'Lasă o recenzie',
      message: `Cum a fost sejurul la ${booking.property.title}? Părerea ta contează!`,
      bookingId: booking.id,
    });

    // Send email
    sendReviewReminderEmail(
      booking.guest.email,
      booking.guest.name,
      booking.property.title,
      appUrl,
      booking.id,
    );

    sent++;
  }

  return NextResponse.json({ ok: true, sent, checked: bookings.length });
}
