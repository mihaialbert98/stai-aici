import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { propertySchema } from '@/lib/validations';

// GET /api/properties – public search
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const guests = searchParams.get('guests');
  const amenities = searchParams.get('amenities'); // comma-separated ids
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);

  const where: any = { isActive: true };
  if (city) where.city = { contains: city, mode: 'insensitive' };
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
      include: { images: { orderBy: { order: 'asc' }, take: 1 }, amenities: { include: { amenity: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({ properties, total, pages: Math.ceil(total / limit) });
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
