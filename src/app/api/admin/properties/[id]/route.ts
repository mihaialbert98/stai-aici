import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { isActive } = await req.json();
  const property = await prisma.property.update({
    where: { id: params.id },
    data: { isActive },
  });
  return NextResponse.json({ property });
}
