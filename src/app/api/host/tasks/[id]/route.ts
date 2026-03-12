import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function ownedTask(id: string, userId: string) {
  return prisma.propertyTask.findFirst({
    where: { id, property: { hostId: userId } },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HOST') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const task = await ownedTask(params.id, session.userId);
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = z.object({
      title: z.string().min(1).max(500).optional(),
      done: z.boolean().optional(),
    }).parse(body);

    const updated = await prisma.propertyTask.update({ where: { id: params.id }, data });
    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error('[tasks PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HOST') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const task = await ownedTask(params.id, session.userId);
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.propertyTask.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tasks DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
