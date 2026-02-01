import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 20;
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      include: { host: { select: { name: true, email: true } }, images: { take: 1, orderBy: { order: 'asc' } }, _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count(),
  ]);
  return NextResponse.json({ properties, total, pages: Math.ceil(total / limit) });
}
