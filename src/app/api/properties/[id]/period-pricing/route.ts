import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { periodPricingSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
const log = logger.child({ service: 'period-pricing' });

// GET /api/properties/[id]/period-pricing - List all period pricings
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      periodPricings: {
        orderBy: { startDate: 'asc' },
      },
    },
  });

  if (!property) {
    log.warn('Property not found when listing period pricing', { propertyId: params.id });
    return NextResponse.json({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
  }

  log.debug('Fetched period pricing list', {
    propertyId: params.id,
    count: property.periodPricings.length,
  });

  return NextResponse.json({ periodPricings: property.periodPricings });
}

// POST /api/properties/[id]/period-pricing - Create period pricing
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    log.warn('Unauthorized period pricing create attempt', { propertyId: params.id });
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { hostId: true },
  });

  if (!property) {
    log.warn('Property not found when creating period pricing', { propertyId: params.id });
    return NextResponse.json({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
  }

  if (property.hostId !== session.userId && session.role !== 'ADMIN') {
    log.warn('Forbidden period pricing create attempt', {
      propertyId: params.id,
      userId: session.userId,
      role: session.role,
    });
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = periodPricingSchema.parse(body);

    const periodPricing = await prisma.periodPricing.create({
      data: {
        propertyId: params.id,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        pricePerNight: data.pricePerNight,
      },
    });

    log.info('Created period pricing', {
      propertyId: params.id,
      periodPricingId: periodPricing.id,
      startDate: data.startDate,
      endDate: data.endDate,
      pricePerNight: data.pricePerNight,
    });

    return NextResponse.json({ periodPricing }, { status: 201 });
  } catch (err: any) {
    log.error('Failed to create period pricing', err, { propertyId: params.id });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PUT /api/properties/[id]/period-pricing - Update period pricing
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    log.warn('Unauthorized period pricing update attempt', { propertyId: params.id });
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { hostId: true },
  });

  if (!property) {
    log.warn('Property not found when updating period pricing', { propertyId: params.id });
    return NextResponse.json({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
  }

  if (property.hostId !== session.userId && session.role !== 'ADMIN') {
    log.warn('Forbidden period pricing update attempt', {
      propertyId: params.id,
      userId: session.userId,
      role: session.role,
    });
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = periodPricingSchema.parse(body);

    if (!data.id) {
      log.warn('Missing period pricing id for update', { propertyId: params.id });
      return NextResponse.json({ error: 'ID-ul perioadei este necesar' }, { status: 400 });
    }

    const periodPricing = await prisma.periodPricing.update({
      where: { id: data.id, propertyId: params.id },
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        pricePerNight: data.pricePerNight,
      },
    });

    log.info('Updated period pricing', {
      propertyId: params.id,
      periodPricingId: data.id,
      startDate: data.startDate,
      endDate: data.endDate,
      pricePerNight: data.pricePerNight,
    });

    return NextResponse.json({ periodPricing });
  } catch (err: any) {
    log.error('Failed to update period pricing', err, {
      propertyId: params.id,
    });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/properties/[id]/period-pricing - Delete period pricing
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    log.warn('Unauthorized period pricing delete attempt', { propertyId: params.id });
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { hostId: true },
  });

  if (!property) {
    log.warn('Property not found when deleting period pricing', { propertyId: params.id });
    return NextResponse.json({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
  }

  if (property.hostId !== session.userId && session.role !== 'ADMIN') {
    log.warn('Forbidden period pricing delete attempt', {
      propertyId: params.id,
      userId: session.userId,
      role: session.role,
    });
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const { id: periodId } = await req.json();

    if (!periodId) {
      log.warn('Missing period pricing id for delete', { propertyId: params.id });
      return NextResponse.json({ error: 'ID-ul perioadei este necesar' }, { status: 400 });
    }

    await prisma.periodPricing.delete({
      where: { id: periodId, propertyId: params.id },
    });

    log.info('Deleted period pricing', {
      propertyId: params.id,
      periodPricingId: periodId,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    log.error('Failed to delete period pricing', err, { propertyId: params.id });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
