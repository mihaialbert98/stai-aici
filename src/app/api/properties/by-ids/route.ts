import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/properties/by-ids?ids=...&ids=...
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.getAll('ids');
  if (!ids.length) return NextResponse.json({ properties: [] });

  const properties = await prisma.property.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      reviews: { select: { rating: true } },
    },
  });

  const propertiesWithRating = properties.map(({ reviews, ...p }) => ({
    ...p,
    avgRating: reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null,
    reviewCount: reviews.length,
  }));

  return NextResponse.json({ properties: propertiesWithRating });
}
