import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getHostProperty } from '@/lib/api-helpers';
import { sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

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

  const updateSchema = z.object({
    isActive:         z.boolean().optional(),
    checkInFrom:      z.string().max(100).optional(),
    checkInTo:        z.string().max(100).optional(),
    checkOutBy:       z.string().max(100).optional(),
    parkingAvailable: z.boolean().optional(),
    parkingInfo:      z.string().max(500).optional(),
    parkingLocation:  z.string().max(500).optional(),
    parkingCode:      z.string().max(200).optional(),
    parkingMapUrl:    z.string().url().optional().nullable()
      .refine(
        (url) => {
          if (!url) return true;
          try {
            const { protocol, hostname } = new URL(url);
            if (protocol !== 'https:') return false;
            const h = hostname.toLowerCase();
            return h === 'www.google.com' || h === 'google.com' || h === 'maps.google.com' || h === 'maps.app.goo.gl' || h === 'goo.gl';
          } catch { return false; }
        },
        { message: 'Must be a valid Google Maps HTTPS link' }
      ),
    transportInfo:    z.string().max(1000).optional(),
    buildingEntrance: z.string().max(500).optional(),
    buildingFloor:    z.string().max(100).optional(),
    buildingCode:     z.string().max(200).optional(),
    buildingNotes:    z.string().max(1000).optional(),
    accessType:       z.string().max(100).optional(),
    accessCode:       z.string().max(200).optional(),
    accessLocation:   z.string().max(500).optional(),
    accessNotes:      z.string().max(1000).optional(),
    wifiName:         z.string().max(200).optional(),
    wifiPassword:     z.string().max(200).optional(),
    apartmentGuide:   z.string().max(2000).optional(),
    houseRules:       z.string().max(2000).optional(),
    checkOutNotes:    z.string().max(2000).optional(),
    hostPhone:        z.string().max(50).optional(),
    emergencyPhone:   z.string().max(50).optional(),
    videoUrl:         z.string().max(500).or(z.literal('')).optional(),
  });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Date invalide', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const {
    isActive,
    checkInFrom, checkInTo, checkOutBy,
    parkingAvailable, parkingInfo, parkingLocation, parkingCode, parkingMapUrl, transportInfo,
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
      const parsedUrl = new URL(videoUrl);
      if (parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'URL-ul video trebuie să fie HTTPS' }, { status: 400 });
      }
      if (!ALLOWED_VIDEO_HOSTS.includes(parsedUrl.hostname)) {
        return NextResponse.json({ error: 'Sunt acceptate doar URL-uri YouTube sau Vimeo' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'URL video invalid' }, { status: 400 });
    }
  }

  const st = (v: string | undefined) => (v !== undefined ? sanitizeText(v) || null : null);

  const data = {
    isActive: isActive ?? true,
    checkInFrom: st(checkInFrom),
    checkInTo: st(checkInTo),
    checkOutBy: st(checkOutBy),
    parkingAvailable: parkingAvailable ?? false,
    parkingInfo: st(parkingInfo),
    parkingLocation: st(parkingLocation),
    parkingCode: st(parkingCode),
    parkingMapUrl: parkingMapUrl ?? null,
    transportInfo: st(transportInfo),
    buildingEntrance: st(buildingEntrance),
    buildingFloor: st(buildingFloor),
    buildingCode: st(buildingCode),
    buildingNotes: st(buildingNotes),
    accessType: st(accessType),
    accessCode: st(accessCode),
    accessLocation: st(accessLocation),
    accessNotes: st(accessNotes),
    wifiName: st(wifiName),
    wifiPassword: st(wifiPassword),
    apartmentGuide: st(apartmentGuide),
    houseRules: st(houseRules),
    checkOutNotes: st(checkOutNotes),
    hostPhone: st(hostPhone),
    emergencyPhone: st(emergencyPhone),
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
