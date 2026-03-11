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
    const type = searchParams.get('type') || 'all'; // 'all' | 'platform' | 'manual'
    const status = searchParams.get('status') || 'all'; // 'all' | 'accepted' | 'pending'

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

    // Determine which booking statuses to include
    const bookingStatuses: BookingStatus[] =
      status === 'accepted' ? [BookingStatus.ACCEPTED] :
      status === 'pending' ? [BookingStatus.PENDING] :
      [BookingStatus.ACCEPTED, BookingStatus.PENDING, BookingStatus.CANCELLED, BookingStatus.REJECTED];

    // Fetch host's property IDs for synced reservation query
    const hostProperties = type !== 'platform' ? await prisma.property.findMany({
      where: { hostId: session.userId, isActive: true },
      select: { id: true },
    }) : [];
    const hostPropertyIds = hostProperties.map(p => p.id);

    const syncedPropertyFilter = propertyIds
      ? { in: propertyIds.split(',').filter(id => hostPropertyIds.includes(id)) }
      : hostPropertyIds.length > 0 ? { in: hostPropertyIds } : undefined;

    const [bookings, manuals, synced] = await Promise.all([
      type !== 'manual' ? prisma.booking.findMany({
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

      type !== 'platform' ? prisma.manualReservation.findMany({
        where: {
          hostId: session.userId,
          ...(propertyFilter ? { propertyId: propertyFilter } : {}),
          ...(manualDateFilter.checkIn ? { checkIn: manualDateFilter.checkIn } : {}),
          ...(manualDateFilter.checkOut ? { checkOut: manualDateFilter.checkOut } : {}),
        },
        include: { property: { select: { id: true, title: true } } },
        orderBy: { checkIn: 'asc' },
      }) : Promise.resolve([]),

      // Synced reservations (from iCal) — shown when type is 'all' or 'manual'
      type !== 'platform' && syncedPropertyFilter ? prisma.syncedReservation.findMany({
        where: {
          propertyId: syncedPropertyFilter,
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
      })),
    ].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const totalRevenue = result
      .filter(r => r.status === 'ACCEPTED' || r.status === 'MANUAL' || r.status === 'SYNCED')
      .reduce((sum, r) => sum + (r.revenue ?? 0), 0);

    return NextResponse.json({ reservations: result, totalRevenue });
  } catch (err) {
    console.error('[reservations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
