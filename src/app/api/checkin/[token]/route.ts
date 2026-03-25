import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/checkin/[token] — public, no auth required
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const link = await prisma.checkInLink.findUnique({
    where: { token: params.token },
    select: {
      isActive: true,
      checkInFrom: true, checkInTo: true, checkOutBy: true,
      parkingAvailable: true, parkingInfo: true, parkingLocation: true, parkingCode: true, transportInfo: true,
      buildingEntrance: true, buildingFloor: true, buildingCode: true, buildingNotes: true,
      accessType: true, accessCode: true, accessLocation: true, accessNotes: true,
      wifiName: true, wifiPassword: true,
      apartmentGuide: true, houseRules: true,
      checkOutNotes: true,
      hostPhone: true, emergencyPhone: true,
      videoUrl: true,
      property: {
        select: {
          title: true,
          city: true,
          address: true,
          images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Link inactiv' }, { status: 410 });

  return NextResponse.json({ link });
}
