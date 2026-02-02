import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/reviews?propertyIds=id1,id2 – get reviews for host's properties
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const propertyIds = req.nextUrl.searchParams.get('propertyIds');
  const propertyFilter = propertyIds ? { in: propertyIds.split(',') } : undefined;

  const reviews = await prisma.review.findMany({
    where: {
      property: {
        hostId: session.userId,
        ...(propertyFilter ? { id: propertyFilter } : {}),
      },
    },
    include: {
      guest: { select: { id: true, name: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const avg = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return NextResponse.json({ reviews, average: avg, count: reviews.length });
}
