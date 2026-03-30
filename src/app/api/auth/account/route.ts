import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 5, windowMs: 15 * 60 * 1000, prefix: 'account-delete' });
    if (limited) return limited;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { password } = deleteAccountSchema.parse(body);

    const uid = session.userId;

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    const activeSubmissionCount = await prisma.guestSubmission.count({
      where: {
        property: { hostId: session.userId },
        retentionDate: { gt: new Date() },
      },
    });
    if (activeSubmissionCount > 0) {
      return NextResponse.json(
        { error: `Contul nu poate fi șters — există ${activeSubmissionCount} fișe de cazare în perioada de retenție legală (5 ani). Revino după expirarea perioadei.` },
        { status: 400 }
      );
    }

    // Pre-fetch IDs needed for deletion outside of the transaction
    const properties = await prisma.property.findMany({
      where: { hostId: uid },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const hostBookings = await prisma.booking.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const hostBookingIds = hostBookings.map((b) => b.id);

    const guestBookings = await prisma.booking.findMany({
      where: { guestId: uid },
      select: { id: true },
    });
    const guestBookingIds = guestBookings.map((b) => b.id);

    const allBookingIds = Array.from(new Set([...hostBookingIds, ...guestBookingIds]));

    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          OR: [{ bookingId: { in: allBookingIds } }, { userId: uid }],
        },
      }),
      prisma.message.deleteMany({
        where: {
          OR: [{ bookingId: { in: allBookingIds } }, { senderId: uid }],
        },
      }),
      prisma.hostReview.deleteMany({
        where: {
          OR: [{ hostId: uid }, { guestId: uid }],
        },
      }),
      prisma.booking.deleteMany({
        where: {
          OR: [{ propertyId: { in: propertyIds } }, { guestId: uid }],
        },
      }),
      prisma.guestSubmission.deleteMany({
        where: { propertyId: { in: propertyIds } },
      }),
      prisma.formRequest.deleteMany({
        where: { hostId: uid },
      }),
      prisma.favorite.deleteMany({
        where: { userId: uid },
      }),
      prisma.property.deleteMany({
        where: { hostId: uid },
      }),
      prisma.user.delete({
        where: { id: uid },
      }),
    ]);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearSessionCookie());
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
