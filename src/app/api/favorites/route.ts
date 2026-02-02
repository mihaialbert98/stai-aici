import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/favorites — return current user's favorite property IDs
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ favoriteIds: [] });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    select: { propertyId: true },
  });

  return NextResponse.json({ favoriteIds: favorites.map(f => f.propertyId) });
}

// POST /api/favorites — toggle favorite (add or remove)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { propertyId } = await req.json();
  if (!propertyId) return NextResponse.json({ error: 'propertyId necesar' }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId: session.userId, propertyId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: session.userId, propertyId } });
  return NextResponse.json({ favorited: true });
}
