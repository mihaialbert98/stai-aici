import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      // DTSTART;VALUE=DATE:20260215 or DTSTART:20260215T140000Z
      if (trimmed.startsWith('DTSTART')) {
        const val = trimmed.split(':').pop()?.trim();
        if (val) start = parseIcalDate(val);
      }
      if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':').pop()?.trim();
        if (val) end = parseIcalDate(val);
      }
    }

    if (start && end && end > start) {
      events.push({ start, end });
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncs = await prisma.calendarSync.findMany({
    include: { property: { select: { id: true } } },
  });

  let synced = 0;
  let errors = 0;

  for (const sync of syncs) {
    try {
      const res = await fetch(sync.icalUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const events = parseIcalEvents(text);

      const blockedDates: Date[] = [];
      for (const event of events) {
        // DTEND is exclusive for DATE values, so last blocked night is end - 1
        const endAdjusted = new Date(event.end);
        endAdjusted.setDate(endAdjusted.getDate() - 1);
        if (endAdjusted < event.start) continue;

        const days = eachDayOfInterval({ start: event.start, end: endAdjusted });
        blockedDates.push(...days);
      }

      // Deduplicate
      const uniqueDateStrs = Array.from(new Set(blockedDates.map(d => format(d, 'yyyy-MM-dd'))));
      const uniqueDates = uniqueDateStrs.map(s => startOfDay(new Date(s)));

      // Remove old synced blocked dates from this platform
      await prisma.blockedDate.deleteMany({
        where: { propertyId: sync.propertyId, source: sync.platform },
      });

      // Insert new ones
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

      synced++;
    } catch (err) {
      console.error(`iCal sync error for ${sync.id} (${sync.icalUrl}):`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, synced, errors, total: syncs.length });
}
