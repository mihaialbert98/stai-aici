import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const host = await prisma.user.findUnique({
    where: { id: params.id, role: 'HOST' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      properties: {
        where: { isActive: true },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!host) {
    return NextResponse.json({ error: 'Gazda nu a fost găsită' }, { status: 404 });
  }

  const totalReviews = host.properties.reduce((sum, p) => sum + p.reviews.length, 0);

  const properties = host.properties.map(p => {
    const ratings = p.reviews.map(r => r.rating);
    const propAvg = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : null;
    return {
      id: p.id,
      title: p.title,
      city: p.city,
      pricePerNight: p.pricePerNight,
      maxGuests: p.maxGuests,
      image: p.images[0]?.url || null,
      avgRating: propAvg,
      reviewCount: p.reviews.length,
    };
  });

  return NextResponse.json({
    host: {
      id: host.id,
      name: host.name,
      memberSince: host.createdAt,
      totalProperties: host.properties.length,
      totalReviews,
    },
    properties,
  });
}
