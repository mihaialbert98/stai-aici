import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}

// GET /api/properties/[id]/checkin-link — get or create link for a property
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const [link, prop] = await Promise.all([
    prisma.checkInLink.upsert({
      where: { propertyId: params.id },
      create: { propertyId: params.id },
      update: {},
    }),
    prisma.property.findUnique({ where: { id: params.id }, select: { title: true } }),
  ]);

  return NextResponse.json({ link, title: prop?.title ?? '' });
}

// PUT /api/properties/[id]/checkin-link — update all check-in link fields
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const body = await req.json();
  const {
    isActive,
    checkInFrom, checkInTo, checkOutBy,
    parkingAvailable, parkingInfo, parkingLocation, parkingCode, transportInfo,
    buildingEntrance, buildingFloor, buildingCode, buildingNotes,
    accessType, accessCode, accessLocation, accessNotes,
    wifiName, wifiPassword,
    apartmentGuide, houseRules,
    checkOutNotes,
    hostPhone, emergencyPhone,
    videoUrl,
  } = body;

  // Validate videoUrl — must be HTTPS from an allowed video host
  if (videoUrl) {
    const ALLOWED_VIDEO_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be', 'player.vimeo.com', 'vimeo.com'];
    try {
      const parsed = new URL(videoUrl);
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'URL-ul video trebuie să fie HTTPS' }, { status: 400 });
      }
      if (!ALLOWED_VIDEO_HOSTS.includes(parsed.hostname)) {
        return NextResponse.json({ error: 'Sunt acceptate doar URL-uri YouTube sau Vimeo' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'URL video invalid' }, { status: 400 });
    }
  }

  const data = {
    isActive: isActive ?? true,
    checkInFrom: checkInFrom || null,
    checkInTo: checkInTo || null,
    checkOutBy: checkOutBy || null,
    parkingAvailable: parkingAvailable ?? false,
    parkingInfo: parkingInfo || null,
    parkingLocation: parkingLocation || null,
    parkingCode: parkingCode || null,
    transportInfo: transportInfo || null,
    buildingEntrance: buildingEntrance || null,
    buildingFloor: buildingFloor || null,
    buildingCode: buildingCode || null,
    buildingNotes: buildingNotes || null,
    accessType: accessType || null,
    accessCode: accessCode || null,
    accessLocation: accessLocation || null,
    accessNotes: accessNotes || null,
    wifiName: wifiName || null,
    wifiPassword: wifiPassword || null,
    apartmentGuide: apartmentGuide || null,
    houseRules: houseRules || null,
    checkOutNotes: checkOutNotes || null,
    hostPhone: hostPhone || null,
    emergencyPhone: emergencyPhone || null,
    videoUrl: videoUrl || null,
  };

  const link = await prisma.checkInLink.upsert({
    where: { propertyId: params.id },
    create: { propertyId: params.id, ...data },
    update: data,
  });

  return NextResponse.json({ link });
}

// POST /api/properties/[id]/checkin-link — regenerate token
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await getHostProperty(params.id, session.userId);
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  await prisma.checkInLink.deleteMany({ where: { propertyId: params.id } });
  const link = await prisma.checkInLink.create({ data: { propertyId: params.id } });

  return NextResponse.json({ link });
}
