import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/checkin-links — returns all host properties with their check-in link status
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const properties = await prisma.property.findMany({
    where: { hostId: session.userId, isActive: true },
    select: {
      id: true,
      title: true,
      images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
      checkInLink: true,
    },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json({ properties });
}
