import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/checkin/[token] — public, no auth required
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const link = await prisma.checkInLink.findUnique({
    where: { token: params.token },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          checkInInfo: true,
          houseRules: true,
          localTips: true,
          images: { orderBy: { order: 'asc' }, select: { url: true } },
          host: { select: { name: true, phone: true } },
        },
      },
    },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Link inactiv' }, { status: 410 });

  return NextResponse.json({
    property: link.property,
    wifiName: link.wifiName,
    wifiPassword: link.wifiPassword,
    videoUrl: link.videoUrl,
  });
}
