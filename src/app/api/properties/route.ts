import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { propertySchema } from '@/lib/validations';
import { removeDiacritics } from '@/lib/utils';
import { ROMANIAN_CITIES } from '@/lib/cities';

export const dynamic = 'force-dynamic';

// GET /api/properties – public search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const guests = searchParams.get('guests');
    const amenities = searchParams.get('amenities'); // comma-separated ids
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);

    const where: any = { isActive: true };
    if (city) {
      // Resolve diacritics: "Brasov" → "Brașov"
      const match = ROMANIAN_CITIES.find(c =>
        removeDiacritics(c).toLowerCase() === removeDiacritics(city).toLowerCase()
      );
      where.city = { contains: match || city, mode: 'insensitive' };
    }
    if (minPrice) where.pricePerNight = { ...where.pricePerNight, gte: parseFloat(minPrice) };
    if (maxPrice) where.pricePerNight = { ...where.pricePerNight, lte: parseFloat(maxPrice) };
    if (guests) where.maxGuests = { gte: parseInt(guests) };
    if (amenities) {
      const ids = amenities.split(',');
      where.amenities = { some: { amenityId: { in: ids } } };
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          amenities: { include: { amenity: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: sortBy === 'price_asc' ? { pricePerNight: 'asc' as const }
              : sortBy === 'price_desc' ? { pricePerNight: 'desc' as const }
              : { createdAt: 'desc' as const },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    let propertiesWithRating = properties.map(({ reviews, ...p }) => ({
      ...p,
      avgRating: reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null,
      reviewCount: reviews.length,
    }));

    if (sortBy === 'rating') {
      propertiesWithRating.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    }

    return NextResponse.json({ properties: propertiesWithRating, total, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error('GET /api/properties error:', err);
    return NextResponse.json({ error: err.message, properties: [], total: 0, pages: 0 }, { status: 500 });
  }
}

// POST /api/properties – host creates property
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = propertySchema.parse(body);
    const { amenityIds, imageUrls, ...propertyData } = data;

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        hostId: session.userId,
        amenities: amenityIds?.length
          ? { create: amenityIds.map((id) => ({ amenityId: id })) }
          : undefined,
        images: imageUrls?.length
          ? { create: imageUrls.map((url, i) => ({ url, order: i })) }
          : undefined,
      },
      include: { images: true, amenities: { include: { amenity: true } } },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
