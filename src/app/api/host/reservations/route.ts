import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { differenceInDays, addDays } from 'date-fns';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HOST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const propertyIds = searchParams.get('propertyIds');
    // type: 'all' | 'platform' | 'manual' | 'synced'
    const type = searchParams.get('type') || 'all';
    // source: filter synced reservations by platform source (e.g. 'airbnb')
    const sourceFilter = searchParams.get('source') || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 20;

    const propertyFilter = propertyIds ? { in: propertyIds.split(',') } : undefined;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const dateFilter = fromDate || toDate ? {
      startDate: toDate ? { lte: toDate } : undefined,
      endDate: fromDate ? { gte: fromDate } : undefined,
    } : {};

    const manualDateFilter = fromDate || toDate ? {
      checkIn: toDate ? { lte: toDate } : undefined,
      checkOut: fromDate ? { gte: fromDate } : undefined,
    } : {};

    const bookingStatuses: BookingStatus[] = [
      BookingStatus.ACCEPTED, BookingStatus.PENDING, BookingStatus.CANCELLED, BookingStatus.REJECTED,
    ];

    // Always fetch host properties (needed for synced queries and platforms list)
    const hostProperties = await prisma.property.findMany({
      where: { hostId: session.userId, isActive: true },
      select: { id: true },
    });
    const hostPropertyIds = hostProperties.map(p => p.id);

    const syncedPropertyFilter = propertyIds
      ? { in: propertyIds.split(',').filter(id => hostPropertyIds.includes(id)) }
      : hostPropertyIds.length > 0 ? { in: hostPropertyIds } : undefined;

    // Fetch calendar sync colors + build platforms list for UI
    const calendarSyncs = hostPropertyIds.length > 0 ? await prisma.calendarSync.findMany({
      where: { propertyId: { in: hostPropertyIds } },
      select: { propertyId: true, platform: true, color: true },
    }) : [];
    const syncColorMap = new Map(calendarSyncs.map(s => [`${s.propertyId}:${s.platform}`, s.color]));

    const showBookings = type === 'all' || type === 'platform';
    const showManuals  = type === 'all' || type === 'manual';
    const showSynced   = type === 'all' || type === 'synced';

    const [bookings, manuals, synced] = await Promise.all([
      showBookings ? prisma.booking.findMany({
        where: {
          hostId: session.userId,
          status: { in: bookingStatuses },
          ...(propertyFilter ? { propertyId: propertyFilter } : {}),
          ...(dateFilter.startDate ? { startDate: dateFilter.startDate } : {}),
          ...(dateFilter.endDate ? { endDate: dateFilter.endDate } : {}),
        },
        include: {
          property: { select: { id: true, title: true } },
          guest: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startDate: 'asc' },
      }) : Promise.resolve([]),

      showManuals ? prisma.manualReservation.findMany({
        where: {
          hostId: session.userId,
          ...(propertyFilter ? { propertyId: propertyFilter } : {}),
          ...(manualDateFilter.checkIn ? { checkIn: manualDateFilter.checkIn } : {}),
          ...(manualDateFilter.checkOut ? { checkOut: manualDateFilter.checkOut } : {}),
        },
        include: { property: { select: { id: true, title: true } } },
        orderBy: { checkIn: 'asc' },
      }) : Promise.resolve([]),

      showSynced && syncedPropertyFilter ? prisma.syncedReservation.findMany({
        where: {
          propertyId: syncedPropertyFilter,
          ...(sourceFilter ? { source: sourceFilter } : {}),
          ...(manualDateFilter.checkIn ? { checkIn: manualDateFilter.checkIn } : {}),
          ...(manualDateFilter.checkOut ? { checkOut: manualDateFilter.checkOut } : {}),
        },
        include: { property: { select: { id: true, title: true } } },
        orderBy: { checkIn: 'asc' },
      }) : Promise.resolve([]),
    ]);

    const result = [
      ...bookings.map(b => ({
        id: b.id,
        type: 'platform' as const,
        propertyId: b.propertyId,
        propertyTitle: b.property.title,
        guestName: b.guest.name,
        guestEmail: b.guest.email,
        checkIn: b.startDate.toISOString(),
        checkOut: b.endDate.toISOString(),
        nights: differenceInDays(b.endDate, b.startDate),
        revenue: b.totalPrice,
        source: null,
        status: b.status,
        notes: null,
        bookingId: b.id,
      })),
      ...manuals.map(r => ({
        id: r.id,
        type: 'manual' as const,
        propertyId: r.propertyId,
        propertyTitle: r.property.title,
        guestName: r.guestName || '—',
        guestEmail: null,
        checkIn: r.checkIn.toISOString(),
        checkOut: r.checkOut.toISOString(),
        nights: differenceInDays(r.checkOut, r.checkIn),
        revenue: r.revenue,
        source: r.source,
        status: 'MANUAL',
        notes: r.notes,
        bookingId: null,
        blockCalendar: r.blockCalendar,
      })),
      ...synced.map(r => ({
        id: r.id,
        type: 'synced' as const,
        propertyId: r.propertyId,
        propertyTitle: r.property.title,
        guestName: r.guestName || '—',
        guestEmail: null,
        checkIn: r.checkIn.toISOString(),
        // SyncedReservation.checkOut stores the last night (inclusive); add 1 day to get the checkout day for display
        checkOut: addDays(r.checkOut, 1).toISOString(),
        nights: differenceInDays(r.checkOut, r.checkIn) + 1,
        revenue: r.revenue,
        source: r.source,
        status: r.isBlock ? 'BLOCKED' : 'SYNCED',
        notes: r.notes,
        bookingId: null,
        isBlock: r.isBlock,
        isBlockManual: r.isBlockManual,
        color: syncColorMap.get(`${r.propertyId}:${r.source}`) || '#6366f1',
      })),
    ].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = result.slice((safePage - 1) * pageSize, safePage * pageSize);

    const totalRevenue = result
      .filter(r => r.status === 'ACCEPTED' || r.status === 'MANUAL' || r.status === 'SYNCED')
      .reduce((sum, r) => sum + (r.revenue ?? 0), 0);

    // Unique platforms for the dropdown (deduplicated by source name)
    const seen = new Set<string>();
    const platforms = calendarSyncs
      .filter(cs => { if (seen.has(cs.platform)) return false; seen.add(cs.platform); return true; })
      .map(cs => ({ source: cs.platform, color: cs.color }));

    return NextResponse.json({ reservations: paginated, totalRevenue, platforms, total, page: safePage, pageSize, totalPages });
  } catch (err) {
    console.error('[reservations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
