import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { eachDayOfInterval, startOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/** Simple iCal parser — extracts VEVENT date ranges */
function parseIcalEvents(text: string): { start: Date; end: Date }[] {
  const events: { start: Date; end: Date }[] = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    let start: Date | null = null;
    let end: Date | null = null;
    for (const line of block.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DTSTART')) {
        const val = trimmed.split(':').pop()?.trim();
        if (val) start = parseIcalDate(val);
      }
      if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':').pop()?.trim();
        if (val) end = parseIcalDate(val);
      }
    }
    if (start && end && end > start) events.push({ start, end });
  }
  return events;
}

function parseIcalDate(val: string): Date | null {
  if (val.length >= 8) {
    const y = parseInt(val.substring(0, 4));
    const m = parseInt(val.substring(4, 6)) - 1;
    const d = parseInt(val.substring(6, 8));
    return new Date(y, m, d);
  }
  return null;
}

async function syncSingleCalendar(sync: { id: string; propertyId: string; platform: string; icalUrl: string }) {
  const res = await fetch(sync.icalUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const events = parseIcalEvents(text);

  const blockedDates: Date[] = [];
  for (const event of events) {
    const endAdjusted = new Date(event.end);
    endAdjusted.setDate(endAdjusted.getDate() - 1);
    if (endAdjusted < event.start) continue;
    blockedDates.push(...eachDayOfInterval({ start: event.start, end: endAdjusted }));
  }

  const uniqueDateStrs = Array.from(new Set(blockedDates.map(d => format(d, 'yyyy-MM-dd'))));
  const uniqueDates = uniqueDateStrs.map(s => startOfDay(new Date(s)));

  await prisma.blockedDate.deleteMany({
    where: { propertyId: sync.propertyId, source: sync.platform },
  });

  if (uniqueDates.length > 0) {
    await prisma.blockedDate.createMany({
      data: uniqueDates.map(date => ({
        propertyId: sync.propertyId,
        date,
        source: sync.platform,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.calendarSync.update({
    where: { id: sync.id },
    data: { lastSynced: new Date() },
  });

  return { dates: uniqueDates.length };
}

// GET — list syncs for a property
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { hostId: true },
  });
  if (!property || property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const syncs = await prisma.calendarSync.findMany({
    where: { propertyId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ syncs });
}

// POST — add a new calendar sync
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { hostId: true },
  });
  if (!property || property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { platform, icalUrl } = await req.json();
  if (!platform || !icalUrl) {
    return NextResponse.json({ error: 'Platforma și URL-ul sunt necesare' }, { status: 400 });
  }

  const sync = await prisma.calendarSync.create({
    data: { propertyId: params.id, platform, icalUrl },
  });

  return NextResponse.json({ sync }, { status: 201 });
}

// DELETE — remove a calendar sync and its blocked dates
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { syncId } = await req.json();
  if (!syncId) return NextResponse.json({ error: 'syncId necesar' }, { status: 400 });

  const sync = await prisma.calendarSync.findUnique({
    where: { id: syncId },
    include: { property: { select: { hostId: true } } },
  });

  if (!sync || sync.property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  // Remove synced blocked dates from this platform
  await prisma.blockedDate.deleteMany({
    where: { propertyId: sync.propertyId, source: sync.platform },
  });

  await prisma.calendarSync.delete({ where: { id: syncId } });

  return NextResponse.json({ ok: true });
}

// PATCH — force sync a single calendar
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { syncId } = await req.json();
  if (!syncId) return NextResponse.json({ error: 'syncId necesar' }, { status: 400 });

  const sync = await prisma.calendarSync.findUnique({
    where: { id: syncId },
    include: { property: { select: { hostId: true } } },
  });

  if (!sync || sync.property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const result = await syncSingleCalendar(sync);
    return NextResponse.json({ ok: true, dates: result.dates, lastSynced: new Date() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Eroare la sincronizare' }, { status: 500 });
  }
}
