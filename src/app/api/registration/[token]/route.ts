import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/registration/[token] — public, returns next pending guest context
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60 * 1000, prefix: 'registration-get' });
  if (limited) return limited;

  const formRequest = await prisma.formRequest.findUnique({
    where: { publicToken: params.token },
    include: {
      property: { select: { title: true, city: true } },
      guestForms: {
        orderBy: { guestIndex: 'asc' },
        select: {
          id: true,
          guestIndex: true,
          submittedAt: true,
          arrivalDate: true,
          departureDate: true,
        },
      },
    },
  });

  if (!formRequest) {
    return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  }

  const nextPending = formRequest.guestForms.find(g => !g.submittedAt);
  const completedCount = formRequest.guestForms.filter(g => g.submittedAt).length;

  if (!nextPending) {
    return NextResponse.json({ status: 'complete', totalGuests: formRequest.totalGuests });
  }

  // Pre-fill dates from the most recently submitted guest (for guest 2, 3, ...)
  const lastSubmitted = formRequest.guestForms
    .filter(g => g.submittedAt)
    .at(-1);

  return NextResponse.json({
    status: 'pending',
    propertyTitle: formRequest.property.title,
    propertyCity: formRequest.property.city,
    // Return in YYYY-MM-DD format for <input type="date">
    arrivalDate: lastSubmitted?.arrivalDate ?? null,
    departureDate: lastSubmitted?.departureDate ?? null,
    guestIndex: nextPending.guestIndex,
    totalGuests: formRequest.totalGuests,
    completedCount,
  });
}
