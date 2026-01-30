import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/properties/[id]/blocked-dates – toggle blocked dates
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property || property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { dates, block } = await req.json() as { dates: string[]; block: boolean };

  if (block) {
    // Add blocked dates (ignore duplicates)
    await prisma.blockedDate.createMany({
      data: dates.map((d) => ({ propertyId: params.id, date: new Date(d) })),
      skipDuplicates: true,
    });
  } else {
    // Remove blocked dates
    await prisma.blockedDate.deleteMany({
      where: { propertyId: params.id, date: { in: dates.map((d) => new Date(d)) } },
    });
  }

  const blockedDates = await prisma.blockedDate.findMany({
    where: { propertyId: params.id },
    select: { date: true },
  });

  return NextResponse.json({ blockedDates });
}
