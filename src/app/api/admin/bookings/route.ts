import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 20;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        property: { select: { title: true, city: true } },
        guest: { select: { name: true, email: true } },
        host: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count(),
  ]);
  return NextResponse.json({ bookings, total, pages: Math.ceil(total / limit) });
}
