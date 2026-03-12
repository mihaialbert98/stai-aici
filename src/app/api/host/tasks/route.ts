import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HOST') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const propertyId = req.nextUrl.searchParams.get('propertyId');
    if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

    const property = await prisma.property.findFirst({ where: { id: propertyId, hostId: session.userId } });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tasks = await prisma.propertyTask.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[tasks GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HOST') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { propertyId, title } = z.object({
      propertyId: z.string(),
      title: z.string().min(1).max(500),
    }).parse(body);

    const property = await prisma.property.findFirst({ where: { id: propertyId, hostId: session.userId } });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const task = await prisma.propertyTask.create({ data: { propertyId, title } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('[tasks POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
