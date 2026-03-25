'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { BookingData, ManualReservationData, SyncedReservationData, PeriodPricing } from '@/types';

export interface UseCalendarDataReturn {
  properties: any[];
  bookings: BookingData[];
  manualReservations: ManualReservationData[];
  syncedReservations: SyncedReservationData[];
  manualBlockedDates: Record<string, Set<string>>;
  blockedDates: Record<string, string[]>;
  syncedDates: Record<string, Record<string, string>>;
  calendarSyncs: Record<string, any[]>;
  periodPricings: Record<string, PeriodPricing[]>;
  loading: boolean;
  refetch: () => Promise<void>;
  setBlockedDates: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setSyncedDates: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  setCalendarSyncs: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setPeriodPricings: React.Dispatch<React.SetStateAction<Record<string, PeriodPricing[]>>>;
}

export function useCalendarData(onSingleProperty?: (id: string) => void): UseCalendarDataReturn {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [manualReservations, setManualReservations] = useState<ManualReservationData[]>([]);
  const [syncedReservations, setSyncedReservations] = useState<SyncedReservationData[]>([]);
  const [manualBlockedDates, setManualBlockedDates] = useState<Record<string, Set<string>>>({});
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [syncedDates, setSyncedDates] = useState<Record<string, Record<string, string>>>({});
  const [calendarSyncs, setCalendarSyncs] = useState<Record<string, any[]>>({});
  const [periodPricings, setPeriodPricings] = useState<Record<string, PeriodPricing[]>>({});

  const processCalendarResponse = useCallback((data: any) => {
    const myProps = data.properties || [];
    setProperties(myProps);
    setBookings(data.bookings || []);

    const blocked: Record<string, string[]> = {};
    const synced: Record<string, Record<string, string>> = {};
    const manualBlocked: Record<string, Set<string>> = {};

    for (const p of myProps) {
      const dates = p.blockedDates || [];
      manualBlocked[p.id] = new Set<string>();
      blocked[p.id] = [];
      synced[p.id] = {};
      dates.forEach((bd: any) => {
        const dateStr = format(new Date(bd.date), 'yyyy-MM-dd');
        if (bd.source?.startsWith('external:')) {
          manualBlocked[p.id].add(dateStr);
          blocked[p.id].push(dateStr);
        } else {
          blocked[p.id].push(dateStr);
          if (bd.source) synced[p.id][dateStr] = bd.source;
        }
      });
    }

    setBlockedDates(blocked);
    setSyncedDates(synced);
    setManualBlockedDates(manualBlocked);
    setManualReservations((data.manualReservations || []).map((mr: any) => ({
      ...mr,
      checkIn: format(new Date(mr.checkIn), 'yyyy-MM-dd'),
      checkOut: format(new Date(mr.checkOut), 'yyyy-MM-dd'),
    })));
    setSyncedReservations((data.syncedReservations || []).map((sr: any) => ({
      ...sr,
      checkIn: format(new Date(sr.checkIn), 'yyyy-MM-dd'),
      checkOut: format(new Date(sr.checkOut), 'yyyy-MM-dd'),
    })));

    return myProps;
  }, []);

  const refetch = useCallback(async () => {
    const data = await fetch('/api/host/calendar').then(r => r.json());
    processCalendarResponse(data);
  }, [processCalendarResponse]);

  useEffect(() => {
    (async () => {
      const data = await fetch('/api/host/calendar').then(r => r.json());
      const myProps = processCalendarResponse(data);

      // Also set calendarSyncs and periodPricings on initial load
      const syncsMap: Record<string, any[]> = {};
      const pricingsMap: Record<string, PeriodPricing[]> = {};
      for (const p of myProps) {
        syncsMap[p.id] = p.calendarSyncs || [];
        pricingsMap[p.id] = (p.periodPricings || []).map((pp: any) => ({
          id: pp.id,
          name: pp.name,
          startDate: pp.startDate,
          endDate: pp.endDate,
          pricePerNight: pp.pricePerNight,
        }));
      }
      setCalendarSyncs(syncsMap);
      setPeriodPricings(pricingsMap);

      if (myProps.length === 1) onSingleProperty?.(myProps[0].id);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    properties,
    bookings,
    manualReservations,
    syncedReservations,
    manualBlockedDates,
    blockedDates,
    syncedDates,
    calendarSyncs,
    periodPricings,
    loading,
    refetch,
    setBlockedDates,
    setSyncedDates,
    setCalendarSyncs,
    setPeriodPricings,
  };
}
