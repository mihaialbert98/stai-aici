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

  const body = await req.json();
  const data: any = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (body.role && ['GUEST', 'HOST'].includes(body.role)) data.role = body.role;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nimic de actualizat' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, isActive: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
