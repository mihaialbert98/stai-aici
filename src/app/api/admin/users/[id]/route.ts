import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH – toggle user active status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { isActive } = await req.json();
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  return NextResponse.json({ user });
}
