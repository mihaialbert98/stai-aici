import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });

  // Prevent deactivating other admins
  if (user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Nu poți modifica un administrator' }, { status: 400 });
  }

  const { isActive } = await req.json();
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({ user: updated });
}
