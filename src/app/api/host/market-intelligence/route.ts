import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchAirbnb } from '@/lib/airbnb-scraper';
import { computeStats, CITY_NAMES, AMENITY_KEY_LIST } from '@/lib/market-intelligence';
import type { AmenityKey } from '@/lib/market-intelligence';

export const dynamic = 'force-dynamic';

const schema = z.object({
  city: z.string().refine(c => CITY_NAMES.has(c), { message: 'Oraș necunoscut' }),
  guests: z.coerce.number().int().min(1).max(16),
  checkin: z.string().date(),
  checkout: z.string().date(),
  amenities: z.string().optional().transform(v =>
    v ? v.split(',').filter(k => AMENITY_KEY_LIST.includes(k as AmenityKey)) as AmenityKey[] : []
  ),
}).refine(d => d.checkin < d.checkout, { message: 'Check-out trebuie să fie după check-in' });

function cacheKey(params: { city: string; guests: number; checkin: string; checkout: string; amenities: AmenityKey[] }) {
  const normalized = { ...params, amenities: [...params.amenities].sort() };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'HOST' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = schema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametri invalizi', details: parsed.error.issues }, { status: 400 });
  }

  const { city, guests, checkin, checkout, amenities } = parsed.data;
  const key = cacheKey({ city, guests, checkin, checkout, amenities });

  // Delete stale entries
  await prisma.marketSearchCache.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  // Check cache
  const cached = await prisma.marketSearchCache.findUnique({ where: { cacheKey: key } });
  if (cached) {
    const results = cached.results as Record<string, unknown>;
    return NextResponse.json({ ...results, cached: true, cachedAt: cached.createdAt.toISOString() });
  }

  // Scrape Airbnb
  let listings;
  try {
    listings = await searchAirbnb({ city, guests, checkin, checkout, amenities });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('403') || msg.includes('429')) {
      return NextResponse.json({ error: 'Serviciul de date nu este disponibil momentan. Încearcă din nou mai târziu.' }, { status: 502 });
    }
    if (msg.includes('timeout') || msg.toLowerCase().includes('abort')) {
      return NextResponse.json({ error: 'Timeout. Încearcă din nou.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Eroare la procesarea datelor. Încearcă din nou.' }, { status: 502 });
  }

  const stats = computeStats(listings.map(l => l.pricePerNight));
  const now = new Date().toISOString();
  const response = { listings, stats, cached: false, cachedAt: now };

  // Only cache non-empty results
  if (stats.count > 0) {
    await prisma.marketSearchCache.create({
      data: {
        cacheKey: key,
        results: response as unknown as Parameters<typeof prisma.marketSearchCache.create>[0]['data']['results'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json(response);
}
