import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { propertySchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/properties/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      host: { select: { id: true, name: true, phone: true } },
      images: { orderBy: { order: 'asc' } },
      amenities: { include: { amenity: true } },
      blockedDates: { select: { date: true, source: true } },
      bookings: {
        where: { status: 'ACCEPTED' },
        select: { startDate: true, endDate: true },
      },
      reviews: {
        include: { guest: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      periodPricings: { orderBy: { startDate: 'asc' } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: 'Proprietatea nu a fost găsită' }, { status: 404 });
  }

  return NextResponse.json({ property });
}

// PUT /api/properties/[id] – host updates own property
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property || (property.hostId !== session.userId && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = propertySchema.parse(body);
    const { amenityIds, imageUrls, ...propertyData } = data;

    // Replace amenities
    if (amenityIds) {
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: params.id } });
      await prisma.propertyAmenity.createMany({
        data: amenityIds.map((id) => ({ propertyId: params.id, amenityId: id })),
      });
    }

    // Replace images
    if (imageUrls) {
      await prisma.propertyImage.deleteMany({ where: { propertyId: params.id } });
      await prisma.propertyImage.createMany({
        data: imageUrls.map((url, i) => ({ propertyId: params.id, url, order: i })),
      });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: propertyData,
      include: { images: true, amenities: { include: { amenity: true } } },
    });

    return NextResponse.json({ property: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
