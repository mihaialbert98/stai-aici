import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/guest-form/[token] — public, returns property name to display on form
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const link = await prisma.guestFormLink.findUnique({
    where: { token: params.token },
    include: {
      property: { select: { title: true, city: true } },
    },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Link inactiv' }, { status: 410 });

  return NextResponse.json({
    propertyTitle: link.property.title,
    propertyCity: link.property.city,
  });
}
