import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/guest-form/[token] — public, returns property name to display on form
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60 * 1000, prefix: 'guest-form-get' });
  if (limited) return limited;
  const link = await prisma.guestFormLink.findUnique({
    where: { token: params.token },
    include: {
      property: { select: { title: true, city: true } },
    },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Link inactiv' }, { status: 403 });

  return NextResponse.json({
    propertyTitle: link.property.title,
    propertyCity: link.property.city,
    activeGuestCount: link.activeGuestCount,
  });
}
