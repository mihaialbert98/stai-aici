import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 20;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { properties: true, bookingsAsGuest: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ]);
  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}
