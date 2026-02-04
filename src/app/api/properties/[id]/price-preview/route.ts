import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateBookingPrice } from '@/lib/pricing';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
const log = logger.child({ service: 'price-preview' });

// GET /api/properties/[id]/price-preview?startDate=&endDate=&guests=
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const guests = parseInt(searchParams.get('guests') || '1', 10);

  if (!startDate || !endDate) {
    log.warn('Missing dates for price preview', {
      propertyId: params.id,
      startDate,
      endDate,
    });
    return NextResponse.json({ error: 'Datele sunt necesare' }, { status: 400 });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: {
        pricePerNight: true,
        baseGuests: true,
        extraGuestPrice: true,
        periodPricings: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            pricePerNight: true,
          },
        },
      },
    });

    if (!property) {
      log.warn('Property not found for price preview', { propertyId: params.id });
      return NextResponse.json({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
    }

    const breakdown = calculateBookingPrice({
      property,
      startDate,
      endDate,
      guests,
    });

    log.info('Calculated price preview', {
      propertyId: params.id,
      startDate,
      endDate,
      guests,
      nights: breakdown.nights,
      totalPrice: breakdown.totalPrice,
      savings: breakdown.savings,
    });

    return NextResponse.json({ breakdown });
  } catch (err) {
    log.error('Failed to generate price preview', err, {
      propertyId: params.id,
      startDate,
      endDate,
      guests,
    });
    return NextResponse.json({ error: 'Eroare la calcularea pretului' }, { status: 500 });
  }
}
