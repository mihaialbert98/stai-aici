import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const { isActive } = await req.json();
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({ property: updated });
}
