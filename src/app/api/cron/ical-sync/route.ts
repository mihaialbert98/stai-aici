import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachDayOfInterval, startOfDay, format, differenceInDays } from 'date-fns';
import { logger } from '@/lib/logger';

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

/** Reject URLs pointing to private/internal infrastructure */
function validateIcalUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' || host === '0.0.0.0' ||
    /^127\./.test(host) || /^10\./.test(host) ||
    /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) || host === '::1'
  ) return false;
  return true;
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
      // DTSTART;VALUE=DATE:20260215 or DTSTART:20260215T140000Z
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

    if (start && end && end > start) {
      events.push({ start, end, summary });
    }
  }

  return events;
}

function parseIcalDate(val: string): Date | null {
  // Format: 20260215 or 20260215T140000Z
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncs = await prisma.calendarSync.findMany({
    include: { property: { select: { id: true } } },
  });

  let synced = 0;
  let errors = 0;
  const syncedPropertyIds = new Set<string>();

  for (const sync of syncs) {
    try {
      if (!validateIcalUrl(sync.icalUrl)) throw new Error('URL iCal nepermis');
      const res = await fetch(sync.icalUrl, { cache: 'no-store', redirect: 'error' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const events = parseIcalEvents(text);

      // Build per-event ranges (checkIn = first night, checkOut = last night inclusive)
      const eventRanges: { checkIn: Date; checkOut: Date; allDays: Date[]; isBlock: boolean; summary: string | null }[] = [];
      const blockedDates: Date[] = [];

      for (const event of events) {
        // DTEND is exclusive for DATE values, so last blocked night is end - 1
        const endAdjusted = new Date(event.end);
        endAdjusted.setDate(endAdjusted.getDate() - 1);
        if (endAdjusted < event.start) continue;

        const days = eachDayOfInterval({ start: event.start, end: endAdjusted });
        blockedDates.push(...days);
        const nights = differenceInDays(endAdjusted, event.start) + 1;
        eventRanges.push({
          checkIn: startOfDay(event.start),
          checkOut: startOfDay(endAdjusted),
          allDays: days,
          isBlock: isBlockEvent(event.summary, nights),
          summary: event.summary,
        });
      }

      // Deduplicate blocked dates
      const uniqueDateStrs = Array.from(new Set(blockedDates.map(d => format(d, 'yyyy-MM-dd'))));
      const uniqueDates = uniqueDateStrs.map(s => startOfDay(new Date(s)));

      // Remove old synced blocked dates from this platform
      await prisma.blockedDate.deleteMany({
        where: { propertyId: sync.propertyId, source: sync.platform },
      });

      // Insert new blocked dates
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

      // Sync SyncedReservation records — preserve guest name/revenue/notes across syncs
      const existingReservations = await prisma.syncedReservation.findMany({
        where: { propertyId: sync.propertyId, source: sync.platform },
      });

      // Build a map: checkIn date string → existing record
      const existingByCheckIn = new Map(
        existingReservations.map(r => [format(r.checkIn, 'yyyy-MM-dd'), r])
      );

      const newCheckInKeys = new Set(
        eventRanges.map(r => format(r.checkIn, 'yyyy-MM-dd'))
      );

      // Upsert each event range
      for (const range of eventRanges) {
        const checkInKey = format(range.checkIn, 'yyyy-MM-dd');
        const existing = existingByCheckIn.get(checkInKey);

        if (existing) {
          // Update checkOut/summary; respect isBlockManual override if set, otherwise use auto-detected
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

      // Delete SyncedReservation records that are no longer in the feed
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

      syncedPropertyIds.add(sync.propertyId);
      synced++;
    } catch (err) {
      logger.error('iCal sync failed', err, { syncId: sync.id, icalUrl: sync.icalUrl });
      errors++;
    }
  }

  // Remove mirror blocks — isBlock records that overlap with a real reservation from another source
  for (const propertyId of syncedPropertyIds) {
    try {
      await deduplicateSyncedBlocks(propertyId);
    } catch (err) {
      logger.error('deduplicateSyncedBlocks failed', err, { propertyId });
    }
  }

  return NextResponse.json({ ok: true, synced, errors, total: syncs.length });
}
