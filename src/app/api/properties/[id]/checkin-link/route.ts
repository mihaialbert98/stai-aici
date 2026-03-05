import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}

// GET /api/properties/[id]/checkin-link — get or create link for a property
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const link = await prisma.checkInLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id },
    update: {},
  });

  return NextResponse.json({ link });
}

// PUT /api/properties/[id]/checkin-link — update wifi/video/isActive
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const body = await req.json();
  const { wifiName, wifiPassword, videoUrl, isActive } = body;

  const link = await prisma.checkInLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id, wifiName, wifiPassword, videoUrl, isActive },
    update: { wifiName, wifiPassword, videoUrl, isActive },
  });

  return NextResponse.json({ link });
}

// POST /api/properties/[id]/checkin-link — regenerate token
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  // Delete old and create fresh (generates new CUID token)
  await prisma.checkInLink.deleteMany({ where: { propertyId: params.id } });
  const link = await prisma.checkInLink.create({ data: { propertyId: params.id } });

  return NextResponse.json({ link });
}
