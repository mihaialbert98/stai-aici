import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/receptionist-signature
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { receptionistSignature: true },
  });

  return NextResponse.json({
    hasSignature: !!user?.receptionistSignature,
    signature: user?.receptionistSignature ?? null,
  });
}

// PUT /api/host/receptionist-signature
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { signature } = await req.json();
  if (!signature || !String(signature).startsWith('data:image/')) {
    return NextResponse.json({ error: 'Semnătură invalidă' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { receptionistSignature: signature },
  });

  return NextResponse.json({ success: true });
}
