import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const properties = await prisma.property.findMany({
    where: { hostId: session.userId },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json({ properties });
}
