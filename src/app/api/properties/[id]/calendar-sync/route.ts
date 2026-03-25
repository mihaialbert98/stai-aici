import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { eachDayOfInterval, startOfDay, format, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

// Summaries that indicate an owner/host block rather than a real reservation
const BLOCK_SUMMARY_RE = /not available|blocked|unavailable|owner block|closed|n\/a/i;
// Events longer than this are almost certainly host blocks, not real guest stays
const BLOCK_MAX_NIGHTS = 180;

function isBlockEvent(summary: string | null, nights: number): boolean {
  if (nights > BLOCK_MAX_NIGHTS) return true;
  if (!summary) return false;
  return BLOCK_SUMMARY_RE.test(summary);
}

/** Simple iCal parser — extracts VEVENT date ranges + SUMMARY */
function parseIcalEvents(text: string): { start: Date; end: Date; summary: string | null }[] {
  const events: { start: Date; end: Date; summary: string | null }[] = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    let start: Date | null = null;
    let end: Date | null = null;
    let summary: string | null = null;
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
      if (trimmed.startsWith('SUMMARY:')) {
        summary = trimmed.slice('SUMMARY:'.length).trim() || null;
      }
    }
    if (start && end && end > start) events.push({ start, end, summary });
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

/** Remove isBlock=true records that overlap with a real reservation from a different source.
 *  This handles cross-platform calendar mirroring (e.g. Airbnb ↔ Booking.com). */
async function deduplicateSyncedBlocks(propertyId: string) {
  const all = await prisma.syncedReservation.findMany({ where: { propertyId } });
  const blocks = all.filter(r => r.isBlock);
  const reservations = all.filter(r => !r.isBlock);
  if (blocks.length === 0 || reservations.length === 0) return;

  const toDelete: string[] = [];
  for (const block of blocks) {
    const isMirror = reservations.some(res =>
      res.source !== block.source &&
      block.checkIn <= res.checkOut &&
      res.checkIn <= block.checkOut
    );
    if (isMirror) toDelete.push(block.id);
  }
  if (toDelete.length > 0) {
    await prisma.syncedReservation.deleteMany({ where: { id: { in: toDelete } } });
  }
}

/** Reject URLs pointing to private/internal infrastructure */
function validateIcalUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'URL iCal invalid';
  }
  if (parsed.protocol !== 'https:') return 'URL-ul iCal trebuie să fie HTTPS';
  const host = parsed.hostname.toLowerCase();
  // Reject localhost and private IP ranges
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === '::1'
  ) {
    return 'URL iCal nepermis';
  }
  return null;
}

async function syncSingleCalendar(sync: { id: string; propertyId: string; platform: string; icalUrl: string }) {
  const urlError = validateIcalUrl(sync.icalUrl);
  if (urlError) throw new Error(urlError);
  const res = await fetch(sync.icalUrl, { cache: 'no-store', redirect: 'error' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const events = parseIcalEvents(text);

  const eventRanges: { checkIn: Date; checkOut: Date; allDays: Date[]; isBlock: boolean; summary: string | null }[] = [];
  const allBlockedDates: Date[] = [];

  for (const event of events) {
    const endAdjusted = new Date(event.end);
    endAdjusted.setDate(endAdjusted.getDate() - 1);
    if (endAdjusted < event.start) continue;
    const days = eachDayOfInterval({ start: event.start, end: endAdjusted });
    allBlockedDates.push(...days);
    const nights = differenceInDays(endAdjusted, event.start) + 1;
    eventRanges.push({
      checkIn: startOfDay(event.start),
      checkOut: startOfDay(endAdjusted),
      allDays: days,
      isBlock: isBlockEvent(event.summary, nights),
      summary: event.summary,
    });
  }

  const uniqueDateStrs = Array.from(new Set(allBlockedDates.map(d => format(d, 'yyyy-MM-dd'))));
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

  // Sync SyncedReservation records, preserving guest name/revenue/notes across syncs
  const existingReservations = await prisma.syncedReservation.findMany({
    where: { propertyId: sync.propertyId, source: sync.platform },
  });
  const existingByCheckIn = new Map(
    existingReservations.map(r => [format(r.checkIn, 'yyyy-MM-dd'), r])
  );
  const newCheckInKeys = new Set(eventRanges.map(r => format(r.checkIn, 'yyyy-MM-dd')));

  for (const range of eventRanges) {
    const checkInKey = format(range.checkIn, 'yyyy-MM-dd');
    const existing = existingByCheckIn.get(checkInKey);
    if (existing) {
      await prisma.syncedReservation.update({
        where: { id: existing.id },
        data: {
          checkOut: range.checkOut,
          isBlock: existing.isBlockManual !== null ? existing.isBlockManual : range.isBlock,
          summary: range.summary,
        },
      });
    } else {
      await prisma.syncedReservation.create({
        data: {
          propertyId: sync.propertyId,
          source: sync.platform,
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          isBlock: range.isBlock,
          summary: range.summary,
        },
      });
    }
  }

  const toDelete = existingReservations.filter(
    r => !newCheckInKeys.has(format(r.checkIn, 'yyyy-MM-dd'))
  );
  if (toDelete.length > 0) {
    await prisma.syncedReservation.deleteMany({
      where: { id: { in: toDelete.map(r => r.id) } },
    });
  }

  await prisma.calendarSync.update({
    where: { id: sync.id },
    data: { lastSynced: new Date() },
  });

  await deduplicateSyncedBlocks(sync.propertyId);

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

  const { platform, icalUrl, color } = await req.json();
  if (!platform || !icalUrl) {
    return NextResponse.json({ error: 'Platforma și URL-ul sunt necesare' }, { status: 400 });
  }
  const urlError = validateIcalUrl(icalUrl);
  if (urlError) {
    return NextResponse.json({ error: urlError }, { status: 400 });
  }

  // Auto-assign a color from the palette based on how many syncs already exist
  const PALETTE = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#6366f1','#8b5cf6','#ec4899','#64748b'];
  const existingCount = await prisma.calendarSync.count({ where: { propertyId: params.id } });
  const assignedColor = color || PALETTE[existingCount % PALETTE.length];

  const sync = await prisma.calendarSync.create({
    data: { propertyId: params.id, platform, icalUrl, color: assignedColor },
  });

  return NextResponse.json({ sync }, { status: 201 });
}

// PUT — update calendar sync settings (color, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const { syncId, color } = await req.json();
  if (!syncId) return NextResponse.json({ error: 'syncId necesar' }, { status: 400 });

  const sync = await prisma.calendarSync.findUnique({
    where: { id: syncId },
    include: { property: { select: { hostId: true } } },
  });
  if (!sync || sync.property.hostId !== session.userId) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const updated = await prisma.calendarSync.update({
    where: { id: syncId },
    data: { ...(color && { color }) },
  });

  return NextResponse.json({ sync: updated });
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

  // Remove synced blocked dates and synced reservations from this platform
  await prisma.blockedDate.deleteMany({
    where: { propertyId: sync.propertyId, source: sync.platform },
  });
  await prisma.syncedReservation.deleteMany({
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
    return NextResponse.json({ error: 'Eroare la sincronizare' }, { status: 500 });
  }
}
