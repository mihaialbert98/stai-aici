import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/form-requests/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const formRequest = await prisma.formRequest.findFirst({
    where: { id: params.id, hostId: session.userId },
    include: {
      property: { select: { id: true, title: true, city: true } },
      guestForms: {
        orderBy: { guestIndex: 'asc' },
      },
    },
  });

  if (!formRequest) {
    return NextResponse.json({ error: 'Formular negăsit' }, { status: 404 });
  }

  return NextResponse.json({ formRequest });
}
