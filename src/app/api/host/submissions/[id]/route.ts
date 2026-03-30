import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const submission = await prisma.guestSubmission.findFirst({
    where: {
      id: params.id,
      property: { hostId: session.userId },
    },
    select: { id: true },
  });

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.guestSubmission.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
