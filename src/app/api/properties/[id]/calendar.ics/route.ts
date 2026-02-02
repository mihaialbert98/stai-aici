import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, addDays, eachDayOfInterval, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

function formatICalDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

function uid(id: string, type: string): string {
  return `${id}-${type}@staiaici.ro`;
}

// Group consecutive dates into ranges for cleaner iCal output
function groupDates(dates: Date[]): { start: Date; end: Date }[] {
  if (!dates.length) return [];
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const ranges: { start: Date; end: Date }[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i].getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff > 1) {
      ranges.push({ start, end: addDays(prev, 1) });
      start = sorted[i];
    }
    prev = sorted[i];
  }
  ranges.push({ start, end: addDays(prev, 1) });
  return ranges;
}

// GET /api/properties/[id]/calendar.ics — public iCal feed
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      isActive: true,
      bookings: {
        where: { status: 'ACCEPTED', endDate: { gte: new Date() } },
        select: { id: true, startDate: true, endDate: true },
      },
      blockedDates: {
        where: { date: { gte: new Date() } },
        select: { id: true, date: true },
      },
    },
  });

  if (!property || !property.isActive) {
    return new NextResponse('Not found', { status: 404 });
  }

  const now = new Date();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StaiAici//Calendar//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${property.title}`,
  ];

  // Add bookings as events
  for (const booking of property.bookings) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(booking.id, 'booking')}`,
      `DTSTART;VALUE=DATE:${formatICalDate(booking.startDate)}`,
      `DTEND;VALUE=DATE:${formatICalDate(booking.endDate)}`,
      `DTSTAMP:${format(now, "yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:Rezervare StaiAici`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  // Add blocked dates as events (grouped into ranges)
  const blockedRanges = groupDates(property.blockedDates.map(d => d.date));
  for (let i = 0; i < blockedRanges.length; i++) {
    const range = blockedRanges[i];
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(`${property.id}-blocked-${i}`, 'blocked')}`,
      `DTSTART;VALUE=DATE:${formatICalDate(range.start)}`,
      `DTEND;VALUE=DATE:${formatICalDate(range.end)}`,
      `DTSTAMP:${format(now, "yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:Blocat StaiAici`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${property.id}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
