import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}

// GET /api/properties/[id]/guest-form-link — get or create form link
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const link = await prisma.guestFormLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id },
    update: {},
  });

  return NextResponse.json({ link });
}

// POST /api/properties/[id]/guest-form-link — regenerate token
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  await prisma.guestFormLink.deleteMany({ where: { propertyId: params.id } });
  const link = await prisma.guestFormLink.create({ data: { propertyId: params.id } });

  return NextResponse.json({ link });
}

// PUT /api/properties/[id]/guest-form-link — toggle isActive
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsedBody = z.object({ isActive: z.boolean() }).safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }
  const { isActive } = parsedBody.data;

  const link = await prisma.guestFormLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id, isActive },
    update: { isActive },
  });

  return NextResponse.json({ link });
}
