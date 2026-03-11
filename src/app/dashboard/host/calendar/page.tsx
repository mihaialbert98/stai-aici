'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday, parseISO, isSameDay, isBefore, isAfter, isWithinInterval,
} from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ExternalLink, MessageSquare, X, Lock, Unlock, RefreshCw, Link2, Trash2, Copy, Plus, DollarSign, Loader2 } from 'lucide-react';
import { formatRON } from '@/lib/utils';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface PeriodPricing {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
}

interface ManualReservationData {
  id: string;
  propertyId: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  revenue: number;
  source: string | null;
  notes: string | null;
  blockCalendar: boolean;
}

interface SyncedReservationData {
  id: string;
  propertyId: string;
  source: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  revenue: number;
  notes: string | null;
  isBlock: boolean;
  isBlockManual: boolean | null;
  summary: string | null;
}

interface BookingData {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  guests: number;
  guest: { id: string; name: string; email: string };
  property: { id: string; title: string; images: { url: string }[] };
}

const PROPERTY_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', pill: 'bg-blue-200 text-blue-900 border-blue-400' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', pill: 'bg-emerald-200 text-emerald-900 border-emerald-400' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', pill: 'bg-purple-200 text-purple-900 border-purple-400' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', pill: 'bg-orange-200 text-orange-900 border-orange-400' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', pill: 'bg-pink-200 text-pink-900 border-pink-400' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', pill: 'bg-teal-200 text-teal-900 border-teal-400' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', pill: 'bg-amber-200 text-amber-900 border-amber-400' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', pill: 'bg-cyan-200 text-cyan-900 border-cyan-400' },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
};

export default function HostCalendarPage() {
  const lang = useLang();
  const t = dashboardT[lang].calendar;
  const dateFnsLocale = lang === 'ro' ? ro : enUS;
  const [properties, setProperties] = useState<any[]>([]);
  const [activePropId, setActivePropId] = useState<string>('all');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [manualReservations, setManualReservations] = useState<ManualReservationData[]>([]);
  const [syncedReservations, setSyncedReservations] = useState<SyncedReservationData[]>([]);
  const [manualBlockedDates, setManualBlockedDates] = useState<Record<string, Set<string>>>({});
  const [editingManual, setEditingManual] = useState<ManualReservationData | null>(null);
  const [editManualForm, setEditManualForm] = useState({ guestName: '', checkIn: '', checkOut: '', revenue: '', source: '', notes: '' });
  const [savingManualEdit, setSavingManualEdit] = useState(false);
  const [editingSynced, setEditingSynced] = useState<SyncedReservationData | null>(null);
  const [editSyncedForm, setEditSyncedForm] = useState({ guestName: '', revenue: '', notes: '', isBlockManual: null as boolean | null });
  const [savingSyncedEdit, setSavingSyncedEdit] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ booking: BookingData; x: number; y: number } | null>(null);
  const [overflowTooltip, setOverflowTooltip] = useState<{ bookings: BookingData[]; x: number; y: number } | null>(null);
  const [blockedTooltip, setBlockedTooltip] = useState<{ properties: string[]; x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Range selection state
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  // Sync state
  const [syncedDates, setSyncedDates] = useState<Record<string, Record<string, string>>>({});
  // syncedDates[propertyId][dateStr] = source (e.g. "booking", "airbnb")
  const [calendarSyncs, setCalendarSyncs] = useState<Record<string, any[]>>({});
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncPlatform, setSyncPlatform] = useState('booking');
  const [syncUrl, setSyncUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Period pricing state
  const [periodPricings, setPeriodPricings] = useState<Record<string, PeriodPricing[]>>({});
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ name: '', pricePerNight: 0 });
  const [savingPrice, setSavingPrice] = useState(false);

  // Manual reservation modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    propertyId: '', guestName: '', checkIn: '', checkOut: '',
    revenue: '', source: '', notes: '', blockCalendar: true,
  });
  const [savingManual, setSavingManual] = useState(false);
  const tm = dashboardT[lang].manualReservation;

  const gridRef = useRef<HTMLDivElement>(null);
  const propDropdownRef = useRef<HTMLDivElement>(null);
  const [propDropdownOpen, setPropDropdownOpen] = useState(false);

  const isAllView = activePropId === 'all';
  const activeProp = properties.find(p => p.id === activePropId);

  const refreshCalendarData = async () => {
    const data = await fetch('/api/host/calendar').then(r => r.json());
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
  };

  useEffect(() => {
    (async () => {
      const data = await fetch('/api/host/calendar').then(r => r.json());
      const myProps = data.properties || [];
      setProperties(myProps);
      setBookings(data.bookings || []);

      const blocked: Record<string, string[]> = {};
      const synced: Record<string, Record<string, string>> = {};
      const manualBlocked: Record<string, Set<string>> = {};
      const syncsMap: Record<string, any[]> = {};
      const pricingsMap: Record<string, PeriodPricing[]> = {};
      for (const p of myProps) {
        const dates = p.blockedDates || [];
        manualBlocked[p.id] = new Set<string>();
        blocked[p.id] = [];
        synced[p.id] = {};
        dates.forEach((bd: any) => {
          const dateStr = format(new Date(bd.date), 'yyyy-MM-dd');
          if (bd.source?.startsWith('external:')) {
            // Manual reservation blocks — tracked separately, shown as pills
            manualBlocked[p.id].add(dateStr);
            blocked[p.id].push(dateStr); // still block for canClick
          } else {
            blocked[p.id].push(dateStr);
            if (bd.source) synced[p.id][dateStr] = bd.source;
          }
        });
        syncsMap[p.id] = p.calendarSyncs || [];
        pricingsMap[p.id] = (p.periodPricings || []).map((pp: any) => ({
          id: pp.id,
          name: pp.name,
          startDate: pp.startDate,
          endDate: pp.endDate,
          pricePerNight: pp.pricePerNight,
        }));
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
      setCalendarSyncs(syncsMap);
      setPeriodPricings(pricingsMap);

      if (myProps.length === 1) setActivePropId(myProps[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-tooltip]') && !target.closest('[data-pill]') && !target.closest('[data-overflow]')) {
        setTooltip(null);
        setOverflowTooltip(null);
        setBlockedTooltip(null);
      }
      if (propDropdownRef.current && !propDropdownRef.current.contains(target)) {
        setPropDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPropertyColor = (propertyId: string) => {
    const idx = properties.findIndex(p => p.id === propertyId);
    return PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
  };

  const getBookingForDate = useCallback((dateStr: string, propId: string) => {
    return bookings.find(b => {
      if (b.property.id !== propId) return false;
      if (b.status !== 'ACCEPTED' && b.status !== 'PENDING') return false;
      const start = b.startDate.split('T')[0];
      const end = b.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  }, [bookings]);

  const getRangeDates = useCallback((start: string, end: string): string[] => {
    const s = parseISO(start);
    const e = parseISO(end);
    const [from, to] = isBefore(s, e) ? [s, e] : [e, s];
    return eachDayOfInterval({ start: from, end: to }).map(d => format(d, 'yyyy-MM-dd'));
  }, []);

  // Get the price for a specific date (checks period pricings, returns highest if overlapping)
  const getPriceForDate = useCallback((dateStr: string, propId: string): { price: number; periodName?: string } | null => {
    const prop = properties.find(p => p.id === propId);
    if (!prop) return null;

    const propPricings = periodPricings[propId] || [];
    const date = parseISO(dateStr);

    // Find all matching period pricings for this date
    const matchingPeriods = propPricings.filter(pp => {
      const start = parseISO(pp.startDate.split('T')[0]);
      const end = parseISO(pp.endDate.split('T')[0]);
      return isWithinInterval(date, { start, end });
    });

    if (matchingPeriods.length > 0) {
      // If multiple periods overlap, use the highest price
      const highest = matchingPeriods.reduce((max, pp) =>
        pp.pricePerNight > max.pricePerNight ? pp : max
      );
      return { price: highest.pricePerNight, periodName: highest.name };
    }

    return { price: prop.pricePerNight };
  }, [properties, periodPricings]);

  const handleDateClick = useCallback((dateStr: string) => {
    if (isAllView) return;
    setConflictMsg(null);

    // Prevent clicking on synced dates
    if (syncedDates[activePropId]?.[dateStr]) {
      setConflictMsg(t.syncedDateConflict(syncedDates[activePropId][dateStr]));
      return;
    }

    const booking = getBookingForDate(dateStr, activePropId);
    if (booking) {
      const guestName = booking.guest.name;
      const start = format(parseISO(booking.startDate), 'd MMM', { locale: dateFnsLocale });
      const end = format(parseISO(booking.endDate), 'd MMM', { locale: dateFnsLocale });
      const statusLabel = booking.status === 'ACCEPTED' ? t.statusAcceptedLabel : t.statusPendingLabel;
      setConflictMsg(t.bookedDateConflict(format(parseISO(dateStr), 'd MMMM', { locale: dateFnsLocale }), statusLabel, guestName, `${start} – ${end}`));
      return;
    }

    if (!rangeStart || rangeEnd) {
      setRangeStart(dateStr);
      setRangeEnd(null);
    } else {
      // Check if range contains any booked dates
      const rangeDates = getRangeDates(rangeStart, dateStr);
      const conflicting = rangeDates
        .map(d => getBookingForDate(d, activePropId))
        .find(b => !!b);
      if (conflicting) {
        const start = format(parseISO(conflicting.startDate), 'd MMM', { locale: dateFnsLocale });
        const end = format(parseISO(conflicting.endDate), 'd MMM', { locale: dateFnsLocale });
        setConflictMsg(t.rangeConflict(conflicting.guest.name, `${start} – ${end}`));
        clearSelection();
        return;
      }
      setRangeEnd(dateStr);
    }
  }, [isAllView, activePropId, rangeStart, rangeEnd, getBookingForDate, getRangeDates]);

  const clearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
    setConflictMsg(null);
    setShowPriceModal(false);
    setPriceForm({ name: '', pricePerNight: activeProp?.pricePerNight || 0 });
  };

  const openPriceModal = () => {
    setPriceForm({
      name: '',
      pricePerNight: activeProp?.pricePerNight || 0,
    });
    setShowPriceModal(true);
  };

  const savePeriodPricing = async () => {
    if (!rangeStart || !activePropId || isAllView) return;
    const end = rangeEnd || rangeStart;
    const dates = getRangeDates(rangeStart, end);
    const [startDate, endDate] = isBefore(parseISO(rangeStart), parseISO(end))
      ? [rangeStart, end]
      : [end, rangeStart];

    // Auto-generate name if not provided
    const periodName = priceForm.name.trim() ||
      `${format(parseISO(startDate), 'd MMM', { locale: dateFnsLocale })} - ${format(parseISO(endDate), 'd MMM', { locale: dateFnsLocale })}`;

    setSavingPrice(true);
    try {
      const res = await fetch(`/api/properties/${activePropId}/period-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: periodName,
          startDate,
          endDate,
          pricePerNight: priceForm.pricePerNight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.saveError);
        setSavingPrice(false);
        return;
      }

      // Update local state with new period pricing
      setPeriodPricings(prev => ({
        ...prev,
        [activePropId]: [...(prev[activePropId] || []), data.periodPricing],
      }));

      toast.success(t.priceSetSuccess(dates.length));
      clearSelection();
    } catch {
      toast.error(t.saveError);
    }
    setSavingPrice(false);
  };

  const confirmBlock = async (block: boolean) => {
    if (isAllView || !rangeStart) return;
    const end = rangeEnd || rangeStart;
    const dates = getRangeDates(rangeStart, end);
    // Double-check: reject if any date has a booking
    const conflicting = dates.find(d => !!getBookingForDate(d, activePropId));
    if (conflicting) {
      setConflictMsg(t.cannotBlock);
      clearSelection();
      return;
    }

    setBlocking(true);
    await fetch(`/api/properties/${activePropId}/blocked-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates, block }),
    });

    setBlockedDates(prev => {
      const propBlocked = prev[activePropId] || [];
      const updated = block
        ? Array.from(new Set([...propBlocked, ...dates]))
        : propBlocked.filter(d => !dates.includes(d));
      return { ...prev, [activePropId]: updated };
    });
    toast.success(block ? t.blockedSuccess(dates.length) : t.unblockedSuccess(dates.length));
    clearSelection();
    setBlocking(false);
  };

  const getPreviewDates = useCallback((): Set<string> => {
    if (!rangeStart) return new Set();
    const end = rangeEnd || hoverDate || rangeStart;
    if (!end) return new Set([rangeStart]);
    return new Set(getRangeDates(rangeStart, end));
  }, [rangeStart, rangeEnd, hoverDate, getRangeDates]);

  const isRangeAllBlocked = useCallback((): boolean => {
    if (isAllView || !rangeStart) return false;
    const end = rangeEnd || rangeStart;
    const dates = getRangeDates(rangeStart, end);
    const propBlocked = blockedDates[activePropId] || [];
    return dates.every(d => propBlocked.includes(d));
  }, [isAllView, activePropId, rangeStart, rangeEnd, getRangeDates, blockedDates]);

  const hasAnyBlocked = useCallback((): boolean => {
    if (isAllView || !rangeStart) return false;
    const end = rangeEnd || rangeStart;
    const dates = getRangeDates(rangeStart, end);
    const propBlocked = blockedDates[activePropId] || [];
    return dates.some(d => propBlocked.includes(d));
  }, [isAllView, activePropId, rangeStart, rangeEnd, getRangeDates, blockedDates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const visibleBookings = bookings.filter(b => {
    if (isAllView ? false : b.property.id !== activePropId) {
      if (!isAllView) return false;
    }
    if (b.status === 'REJECTED' || b.status === 'CANCELLED') return false;
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    return !(isAfter(start, monthEnd) || isBefore(end, monthStart));
  });

  const getPillInfo = (booking: BookingData) => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    const clampedStart = isBefore(start, monthStart) ? monthStart : start;
    const clampedEnd = isAfter(end, monthEnd) ? monthEnd : end;
    const startIdx = startPad + days.findIndex(d => isSameDay(d, clampedStart));
    const endIdx = startPad + days.findIndex(d => isSameDay(d, clampedEnd));
    const rows: { row: number; colStart: number; colEnd: number }[] = [];
    let currentCol = startIdx;
    while (currentCol <= endIdx) {
      const rowNum = Math.floor(currentCol / 7);
      const rowEnd = Math.min(endIdx, (rowNum + 1) * 7 - 1);
      rows.push({ row: rowNum, colStart: currentCol % 7, colEnd: rowEnd % 7 });
      currentCol = (rowNum + 1) * 7;
    }
    return rows;
  };

  const getManualPillInfo = (mr: ManualReservationData) => {
    const start = parseISO(mr.checkIn);
    const end = parseISO(mr.checkOut);
    const clampedStart = isBefore(start, monthStart) ? monthStart : start;
    const clampedEnd = isAfter(end, monthEnd) ? monthEnd : end;
    if (isAfter(clampedStart, monthEnd) || isBefore(clampedEnd, monthStart)) return [];
    const startIdx = startPad + days.findIndex(d => isSameDay(d, clampedStart));
    const endIdx = startPad + days.findIndex(d => isSameDay(d, clampedEnd));
    if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return [];
    const rows: { row: number; colStart: number; colEnd: number }[] = [];
    let currentCol = startIdx;
    while (currentCol <= endIdx) {
      const rowNum = Math.floor(currentCol / 7);
      const rowEnd = Math.min(endIdx, (rowNum + 1) * 7 - 1);
      rows.push({ row: rowNum, colStart: currentCol % 7, colEnd: rowEnd % 7 });
      currentCol = (rowNum + 1) * 7;
    }
    return rows;
  };

  const getSyncedPillInfo = (sr: SyncedReservationData) => {
    const start = parseISO(sr.checkIn);
    const end = parseISO(sr.checkOut);
    const clampedStart = isBefore(start, monthStart) ? monthStart : start;
    const clampedEnd = isAfter(end, monthEnd) ? monthEnd : end;
    if (isAfter(clampedStart, monthEnd) || isBefore(clampedEnd, monthStart)) return [];
    const startIdx = startPad + days.findIndex(d => isSameDay(d, clampedStart));
    const endIdx = startPad + days.findIndex(d => isSameDay(d, clampedEnd));
    if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return [];
    const rows: { row: number; colStart: number; colEnd: number }[] = [];
    let currentCol = startIdx;
    while (currentCol <= endIdx) {
      const rowNum = Math.floor(currentCol / 7);
      const rowEnd = Math.min(endIdx, (rowNum + 1) * 7 - 1);
      rows.push({ row: rowNum, colStart: currentCol % 7, colEnd: rowEnd % 7 });
      currentCol = (rowNum + 1) * 7;
    }
    return rows;
  };

  const openEditSynced = (sr: SyncedReservationData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditSyncedForm({
      guestName: sr.guestName || '',
      revenue: String(sr.revenue),
      notes: sr.notes || '',
      isBlockManual: sr.isBlockManual,
    });
    setEditingSynced(sr);
  };


  const saveSyncedEdit = async () => {
    if (!editingSynced) return;
    setSavingSyncedEdit(true);
    try {
      await fetch(`/api/host/synced-reservations/${editingSynced.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: editSyncedForm.guestName || null,
          revenue: parseFloat(editSyncedForm.revenue) || 0,
          notes: editSyncedForm.notes || null,
          isBlockManual: editSyncedForm.isBlockManual,
        }),
      });
      setEditingSynced(null);
      await refreshCalendarData();
      toast.success(lang === 'ro' ? 'Rezervare actualizată' : 'Reservation updated');
    } catch {
      toast.error(lang === 'ro' ? 'Eroare la salvare' : 'Error saving');
    } finally {
      setSavingSyncedEdit(false);
    }
  };

  const openEditManual = (mr: ManualReservationData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditManualForm({
      guestName: mr.guestName || '',
      checkIn: mr.checkIn,
      checkOut: mr.checkOut,
      revenue: String(mr.revenue),
      source: mr.source || '',
      notes: mr.notes || '',
    });
    setEditingManual(mr);
  };

  const saveManualEdit = async () => {
    if (!editingManual) return;
    setSavingManualEdit(true);
    try {
      await fetch(`/api/host/manual-reservations/${editingManual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: editManualForm.guestName || null,
          checkIn: editManualForm.checkIn,
          checkOut: editManualForm.checkOut,
          revenue: parseFloat(editManualForm.revenue) || 0,
          source: editManualForm.source || null,
          notes: editManualForm.notes || null,
          blockCalendar: true,
        }),
      });
      setEditingManual(null);
      await refreshCalendarData();
      toast.success(lang === 'ro' ? 'Rezervare actualizată' : 'Reservation updated');
    } catch {
      toast.error(lang === 'ro' ? 'Eroare la salvare' : 'Error saving');
    } finally {
      setSavingManualEdit(false);
    }
  };

  const deleteManualEdit = async () => {
    if (!editingManual || !confirm(tm.deleteConfirm)) return;
    try {
      await fetch(`/api/host/manual-reservations/${editingManual.id}`, { method: 'DELETE' });
      setEditingManual(null);
      await refreshCalendarData();
      toast.success(lang === 'ro' ? 'Rezervare ștearsă' : 'Reservation deleted');
    } catch {
      toast.error(lang === 'ro' ? 'Eroare la ștergere' : 'Error deleting');
    }
  };

  const handlePillClick = (e: React.MouseEvent<HTMLDivElement>, booking: BookingData) => {
    e.stopPropagation();
    const rect = gridRef.current?.getBoundingClientRect();
    const pillRect = e.currentTarget.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ booking, x: pillRect.left - rect.left, y: pillRect.bottom - rect.top + 4 });
  };

  const openManualModal = () => {
    setManualForm({
      propertyId: !isAllView ? activePropId : (properties[0]?.id || ''),
      guestName: '', checkIn: '', checkOut: '',
      revenue: '', source: '', notes: '', blockCalendar: true,
    });
    setShowManualModal(true);
  };

  const saveManualReservation = async () => {
    if (!manualForm.propertyId || !manualForm.checkIn || !manualForm.checkOut || !manualForm.revenue) return;
    setSavingManual(true);
    try {
      const res = await fetch('/api/host/manual-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualForm }),
      });
      if (!res.ok) throw new Error();
      // Always refresh calendar data to update pills and blocked dates
      await refreshCalendarData();
      setShowManualModal(false);
      toast.success(lang === 'ro' ? 'Rezervare adăugată' : 'Reservation added');
    } catch {
      toast.error(lang === 'ro' ? 'Eroare la salvare' : 'Error saving');
    } finally {
      setSavingManual(false);
    }
  };

  if (loading) return <p className="text-gray-500">{t.loading}</p>;

  const totalRows = Math.ceil((startPad + days.length) / 7);
  const previewDates = getPreviewDates();
  const propBlocked = !isAllView ? (blockedDates[activePropId] || []) : [];
  const blockedCount = propBlocked.length;
  const rangeCount = rangeStart ? getRangeDates(rangeStart, rangeEnd || rangeStart).length : 0;
  const allBlocked = isRangeAllBlocked();

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        {properties.length > 0 && (
          <button onClick={openManualModal} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> {t.addManualReservation}
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <p className="text-gray-500">{t.noProperties}</p>
      ) : (
        <>
          {/* Property selector */}
          <div className="relative mb-6" ref={propDropdownRef}>
            <button
              type="button"
              onClick={() => setPropDropdownOpen(o => !o)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition flex items-center justify-between ${
                isAllView
                  ? 'bg-white border-gray-300 text-gray-700'
                  : (() => { const c = getPropertyColor(activePropId); return `${c.bg} ${c.border} ${c.text}`; })()
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {!isAllView && (
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getPropertyColor(activePropId).text.replace('text-', 'bg-')}`} />
                )}
                <span className="truncate">
                  {isAllView ? t.allProperties : activeProp?.title}
                </span>
                {!isAllView && blockedCount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                    {t.blockedCount(blockedCount)}
                  </span>
                )}
              </div>
              <ChevronRight size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${propDropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            {propDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {properties.length > 1 && (
                  <button
                    onClick={() => { setActivePropId('all'); clearSelection(); setPropDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${isAllView ? 'font-semibold bg-gray-50' : ''}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                    {t.allProperties}
                    <span className="text-xs text-gray-400 ml-auto">{t.viewOnly}</span>
                  </button>
                )}
                {properties.length > 1 && <div className="border-t border-gray-100 my-1" />}
                {properties.map((p, idx) => {
                  const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
                  const isActive = activePropId === p.id;
                  const propBlockedCount = (blockedDates[p.id] || []).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setActivePropId(p.id); clearSelection(); setPropDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${isActive ? 'font-semibold bg-gray-50' : ''}`}
                    >
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${color.bg} ${color.border} border`} />
                      <span className="truncate">{p.title}</span>
                      {propBlockedCount > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium ml-auto flex-shrink-0">
                          {t.blockedCount(propBlockedCount)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="min-h-[2.5rem] mb-4 flex items-start flex-col gap-2">
            {!isAllView ? (
              <p className="text-sm text-gray-500">
                <Lock size={13} className="inline mr-1 -mt-0.5" />
                {t.instructions}
                {blockedCount > 0 && <span className="text-red-500 ml-1">{t.blockedDaysHint(blockedCount)}</span>}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {t.overviewInstructions}
              </p>
            )}
            {conflictMsg && (
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 w-full">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{conflictMsg}</span>
                <button onClick={() => setConflictMsg(null)} className="ml-auto flex-shrink-0 text-amber-500 hover:text-amber-700">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => { setCurrentMonth(m => addMonths(m, -1)); clearSelection(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={22} />
              </button>
              <h3 className="text-lg font-semibold capitalize">{format(currentMonth, 'LLLL yyyy', { locale: dateFnsLocale })}</h3>
              <button onClick={() => { setCurrentMonth(m => addMonths(m, 1)); clearSelection(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0 text-center text-xs md:text-sm font-medium text-gray-500 mb-1 border-b border-gray-200 pb-2">
              {t.dayHeaders.map(d => (
                <span key={d.short}>
                  <span className="md:hidden">{d.short}</span>
                  <span className="hidden md:inline">{d.full}</span>
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="relative" ref={gridRef}>
              <div className="grid grid-cols-7 gap-0">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-20 md:h-28 border-b border-r border-gray-100" />
                ))}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isBlockedHere = propBlocked.includes(dateStr);
                  const isManualBlocked = !isAllView && (manualBlockedDates[activePropId]?.has(dateStr) ?? false);
                  const syncSource = !isAllView ? syncedDates[activePropId]?.[dateStr] : null;
                  // All dates from external calendars are shown as pills — never red cells
                  const isSynced = !!syncSource;
                  // True when the date is blocked ONLY by a manual reservation (no other block type)
                  const isOnlyManualBlocked = isManualBlocked && !isSynced;
                  // In "all" view, show blocked if any property has it blocked (excluding manual blocks)
                  const isBlockedAny = isAllView && properties.some(p => (blockedDates[p.id] || []).includes(dateStr) && !manualBlockedDates[p.id]?.has(dateStr));
                  const isInPreview = !isAllView && previewDates.has(dateStr);
                  const isRangeEdge = dateStr === rangeStart || dateStr === rangeEnd;
                  const hasAcceptedBooking = !isAllView && !!getBookingForDate(dateStr, activePropId);
                  const canClick = !isAllView && !isSynced && !isManualBlocked && (!hasAcceptedBooking || getBookingForDate(dateStr, activePropId)?.status !== 'ACCEPTED');

                  return (
                    <div
                      key={dateStr}
                      onClick={() => canClick && handleDateClick(dateStr)}
                      onMouseEnter={() => {
                        if (!isAllView && rangeStart && !rangeEnd && !isMobile) setHoverDate(dateStr);
                      }}
                      onMouseLeave={() => { if (!isMobile) setHoverDate(null); }}
                      className={`h-20 md:h-28 border-b border-r border-gray-100 p-0.5 md:p-1 text-right relative transition-colors
                        ${!isAllView && canClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                        ${isToday(day) && !isInPreview && !isBlockedHere ? 'bg-primary-50' : ''}
                        ${(isBlockedHere || isBlockedAny) && !isSynced && !isInPreview && !isOnlyManualBlocked ? 'bg-red-50' : ''}
                        ${isInPreview && !isBlockedHere ? 'bg-indigo-50' : ''}
                        ${isInPreview && isBlockedHere ? 'bg-red-100' : ''}
                        ${(hasAcceptedBooking || isSynced || isManualBlocked) && !isAllView ? 'cursor-default' : ''}
                      `}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm rounded-full z-[1] relative ${
                        isRangeEdge && !isAllView
                          ? 'bg-indigo-600 text-white font-bold'
                          : isToday(day) ? 'bg-primary-600 text-white font-bold'
                          : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {/* TODO: uncomment when per-day pricing display is enabled
                      {!isAllView && !isBlockedHere && (() => {
                        const priceInfo = getPriceForDate(dateStr, activePropId);
                        if (!priceInfo) return null;
                        const isPeriodPrice = !!priceInfo.periodName;
                        return (
                          <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] md:text-xs font-semibold ${
                            isPeriodPrice ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            {priceInfo.price}
                          </span>
                        );
                      })()}
                      */}
                      {/* Blocked indicator — not shown for manual reservation days or synced days (shown as pills) */}
                      {isBlockedHere && !isOnlyManualBlocked && !isSynced && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-red-400">
                          {t.blockedLabel}
                        </span>
                      )}
                      {/* In "all" view, show which properties have this date blocked */}
                      {isAllView && (() => {
                        const blockedProps = properties.filter(p => (blockedDates[p.id] || []).includes(dateStr) && !manualBlockedDates[p.id]?.has(dateStr));
                        if (!blockedProps.length) return null;
                        return (
                          <div
                            data-blocked-dots
                            className="absolute bottom-0.5 left-0.5 flex gap-0.5 flex-wrap cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = gridRef.current?.getBoundingClientRect();
                              const targetRect = e.currentTarget.getBoundingClientRect();
                              if (!rect) return;
                              setTooltip(null);
                              setOverflowTooltip(null);
                              setBlockedTooltip({
                                properties: blockedProps.map(bp => bp.title),
                                x: targetRect.left - rect.left,
                                y: targetRect.top - rect.top - 8,
                              });
                            }}
                          >
                            {blockedProps.map((p) => {
                              const color = getPropertyColor(p.id);
                              return (
                                <span
                                  key={p.id}
                                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${color.bg} ${color.border} border`}
                                />
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Reservation pill overlays */}
              {(() => {
                const pillH = isMobile ? 18 : 22;
                const pillGap = 2;
                const cellH = isMobile ? 80 : 112;
                const pillOffset = isMobile ? 26 : 30;
                const maxSlots = Math.floor((cellH - pillOffset) / (pillH + pillGap));

                const cellBookings: Map<string, { booking: BookingData; stackIndex: number }[]> = new Map();
                const pillSegments: { booking: BookingData; bookingIdx: number; pr: { row: number; colStart: number; colEnd: number }; ri: number; stackIndex: number }[] = [];

                visibleBookings.forEach((booking, bookingIdx) => {
                  const pillRows = getPillInfo(booking);
                  pillRows.forEach((pr, ri) => {
                    let stackIndex = 0;
                    for (let i = 0; i < bookingIdx; i++) {
                      const otherRows = getPillInfo(visibleBookings[i]);
                      const overlaps = otherRows.some(or => or.row === pr.row &&
                        !(or.colEnd < pr.colStart || or.colStart > pr.colEnd));
                      if (overlaps) stackIndex++;
                    }
                    pillSegments.push({ booking, bookingIdx, pr, ri, stackIndex });
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      const key = `${pr.row}-${c}`;
                      if (!cellBookings.has(key)) cellBookings.set(key, []);
                      cellBookings.get(key)!.push({ booking, stackIndex });
                    }
                  });
                });

                const overflowCells: Map<string, BookingData[]> = new Map();
                cellBookings.forEach((entries, key) => {
                  if (entries.length > maxSlots) {
                    overflowCells.set(key, entries.map(e => e.booking));
                  }
                });

                const globallyHiddenBookings = new Set<string>();
                pillSegments.forEach(seg => {
                  for (let c = seg.pr.colStart; c <= seg.pr.colEnd; c++) {
                    const key = `${seg.pr.row}-${c}`;
                    if (overflowCells.has(key) && seg.stackIndex >= maxSlots - 1) {
                      globallyHiddenBookings.add(seg.booking.id);
                      break;
                    }
                  }
                });
                const hiddenPills = new Set<string>();
                pillSegments.forEach(seg => {
                  if (globallyHiddenBookings.has(seg.booking.id)) {
                    hiddenPills.add(`${seg.booking.id}-${seg.ri}`);
                  }
                });

                // Manual reservation pills — stacked after platform booking pills
                const visibleManuals = manualReservations.filter(mr => {
                  if (!isAllView && mr.propertyId !== activePropId) return false;
                  return !(isAfter(parseISO(mr.checkIn), monthEnd) || isBefore(parseISO(mr.checkOut), monthStart));
                });
                const visibleSynced = syncedReservations.filter(sr => {
                  if (!isAllView && sr.propertyId !== activePropId) return false;
                  return !(isAfter(parseISO(sr.checkIn), monthEnd) || isBefore(parseISO(sr.checkOut), monthStart));
                });
                // Track max stackIndex per cell to stack manuals on top
                const cellMaxStack: Map<string, number> = new Map();
                pillSegments.forEach(seg => {
                  for (let c = seg.pr.colStart; c <= seg.pr.colEnd; c++) {
                    const key = `${seg.pr.row}-${c}`;
                    cellMaxStack.set(key, Math.max(cellMaxStack.get(key) ?? -1, seg.stackIndex));
                  }
                });
                const manualPillSegments: { mr: ManualReservationData; pr: { row: number; colStart: number; colEnd: number }; ri: number; stackIndex: number }[] = [];
                visibleManuals.forEach(mr => {
                  const pillRows = getManualPillInfo(mr);
                  pillRows.forEach((pr, ri) => {
                    let maxExisting = -1;
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      maxExisting = Math.max(maxExisting, cellMaxStack.get(`${pr.row}-${c}`) ?? -1);
                    }
                    const stackIndex = maxExisting + 1;
                    manualPillSegments.push({ mr, pr, ri, stackIndex });
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      const key = `${pr.row}-${c}`;
                      cellMaxStack.set(key, Math.max(cellMaxStack.get(key) ?? -1, stackIndex));
                    }
                  });
                });

                const syncedPillSegments: { sr: SyncedReservationData; pr: { row: number; colStart: number; colEnd: number }; ri: number; stackIndex: number }[] = [];
                visibleSynced.forEach(sr => {
                  const pillRows = getSyncedPillInfo(sr);
                  pillRows.forEach((pr, ri) => {
                    let maxExisting = -1;
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      maxExisting = Math.max(maxExisting, cellMaxStack.get(`${pr.row}-${c}`) ?? -1);
                    }
                    const stackIndex = maxExisting + 1;
                    syncedPillSegments.push({ sr, pr, ri, stackIndex });
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      const key = `${pr.row}-${c}`;
                      cellMaxStack.set(key, Math.max(cellMaxStack.get(key) ?? -1, stackIndex));
                    }
                  });
                });

                const badgeCells: Map<string, { row: number; col: number; count: number; bookings: BookingData[] }> = new Map();
                cellBookings.forEach((entries, key) => {
                  const hiddenInCell = entries.filter(e => globallyHiddenBookings.has(e.booking.id)).map(e => e.booking);
                  const unique = Array.from(new Map(hiddenInCell.map(b => [b.id, b])).values());
                  if (unique.length > 0) {
                    const [row, col] = key.split('-').map(Number);
                    badgeCells.set(key, { row, col, count: unique.length, bookings: unique });
                  }
                });

                return (
                  <>
                    {pillSegments.filter(seg => !hiddenPills.has(`${seg.booking.id}-${seg.ri}`)).map(seg => {
                      const color = isAllView ? getPropertyColor(seg.booking.property.id) : PROPERTY_COLORS[0];
                      const top = (seg.pr.row * cellH) + pillOffset + seg.stackIndex * (pillH + pillGap);
                      const left = `${(seg.pr.colStart / 7) * 100}%`;
                      const width = `${((seg.pr.colEnd - seg.pr.colStart + 1) / 7) * 100}%`;
                      return (
                        <div
                          key={`${seg.booking.id}-${seg.ri}`}
                          data-pill
                          onClick={(e) => handlePillClick(e, seg.booking)}
                          className={`absolute ${color.pill} border rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{ top: `${top}px`, left, width, height: `${pillH}px`, zIndex: 10 + seg.stackIndex }}
                          title={`${seg.booking.guest.name} - ${seg.booking.property.title}`}
                        >
                          {isMobile ? seg.booking.guest.name.split(' ')[0] : seg.booking.guest.name}
                          {!isMobile && isAllView && ` · ${seg.booking.property.title}`}
                        </div>
                      );
                    })}

                    {Array.from(badgeCells.values()).map(({ row, col, count, bookings: cellBk }) => {
                      const top = (row * cellH) + pillOffset + (maxSlots - 1) * (pillH + pillGap);
                      const left = `${(col / 7) * 100}%`;
                      const width = `${(1 / 7) * 100}%`;
                      return (
                        <div
                          key={`more-${row}-${col}`}
                          data-overflow
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = gridRef.current?.getBoundingClientRect();
                            const badgeRect = e.currentTarget.getBoundingClientRect();
                            if (!rect) return;
                            setTooltip(null);
                            setOverflowTooltip({
                              bookings: cellBk,
                              x: badgeRect.left - rect.left,
                              y: badgeRect.bottom - rect.top + 4,
                            });
                          }}
                          className="absolute px-1 text-[10px] md:text-xs font-semibold text-gray-600 truncate cursor-pointer hover:text-primary-600"
                          style={{ top: `${top}px`, left, width, height: `${pillH}px`, lineHeight: `${pillH}px`, zIndex: 20 }}
                        >
                          +{count}
                        </div>
                      );
                    })}

                    {manualPillSegments.filter(seg => seg.stackIndex < maxSlots).map(seg => {
                      const top = (seg.pr.row * cellH) + pillOffset + seg.stackIndex * (pillH + pillGap);
                      const left = `${(seg.pr.colStart / 7) * 100}%`;
                      const width = `${((seg.pr.colEnd - seg.pr.colStart + 1) / 7) * 100}%`;
                      const label = seg.mr.guestName || seg.mr.source || (lang === 'ro' ? 'Rezervare manuală' : 'Manual reservation');
                      return (
                        <div
                          key={`manual-${seg.mr.id}-${seg.ri}`}
                          data-pill
                          onClick={(e) => openEditManual(seg.mr, e)}
                          className="absolute bg-amber-200 text-amber-900 border border-amber-400 rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ top: `${top}px`, left, width, height: `${pillH}px`, zIndex: 10 + seg.stackIndex }}
                          title={`${label}${isAllView ? ` · ${manualReservations.find(m => m.id === seg.mr.id) ? properties.find(p => p.id === seg.mr.propertyId)?.title || '' : ''}` : ''}`}
                        >
                          {isMobile ? label.split(' ')[0] : label}
                          {!isMobile && isAllView && ` · ${properties.find(p => p.id === seg.mr.propertyId)?.title || ''}`}
                        </div>
                      );
                    })}

                    {syncedPillSegments.filter(seg => seg.stackIndex < maxSlots).map(seg => {
                      const top = (seg.pr.row * cellH) + pillOffset + seg.stackIndex * (pillH + pillGap);
                      const left = `${(seg.pr.colStart / 7) * 100}%`;
                      const width = `${((seg.pr.colEnd - seg.pr.colStart + 1) / 7) * 100}%`;
                      const propTitle = isAllView ? properties.find(p => p.id === seg.sr.propertyId)?.title || '' : '';
                      const isBlock = seg.sr.isBlock;
                      const blockLabel = lang === 'ro' ? `Blocat · ${seg.sr.source}` : `Blocked · ${seg.sr.source}`;
                      const label = seg.sr.guestName || (isBlock ? blockLabel : seg.sr.source);
                      const pillClass = isBlock
                        ? 'absolute bg-gray-100 text-gray-500 border border-gray-300 border-dashed rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity'
                        : 'absolute bg-violet-200 text-violet-900 border border-violet-400 rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity';
                      return (
                        <div
                          key={`synced-${seg.sr.id}-${seg.ri}`}
                          data-pill
                          onClick={(e) => openEditSynced(seg.sr, e)}
                          className={`absolute ${pillClass}`}
                          style={{ top: `${top}px`, left, width, height: `${pillH}px`, zIndex: 10 + seg.stackIndex }}
                          title={`${label}${propTitle ? ` · ${propTitle}` : ''}`}
                        >
                          {isMobile ? label.split(' ')[0] : label}
                          {!isMobile && isAllView && ` · ${propTitle}`}
                        </div>
                      );
                    })}
                  </>
                );
              })()}

              {/* Tooltip */}
              {tooltip && (
                <div
                  data-tooltip
                  className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-72"
                  style={{
                    top: Math.min(tooltip.y, (totalRows * (isMobile ? 80 : 112)) - 200),
                    left: Math.min(Math.max(tooltip.x, 0), gridRef.current ? gridRef.current.clientWidth - 300 : 0),
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-sm">{tooltip.booking.property.title}</h4>
                    <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">{t.tooltipGuest}</span> {tooltip.booking.guest.name}</p>
                    <p><span className="text-gray-500">{t.tooltipPeriod}</span> {format(parseISO(tooltip.booking.startDate), 'd MMM', { locale: dateFnsLocale })} – {format(parseISO(tooltip.booking.endDate), 'd MMM yyyy', { locale: dateFnsLocale })}</p>
                    <p><span className="text-gray-500">{t.tooltipGuests}</span> {tooltip.booking.guests}</p>
                    <p><span className="text-gray-500">{t.tooltipTotal}</span> {formatRON(tooltip.booking.totalPrice)}</p>
                    <p>
                      <span className="text-gray-500">{t.tooltipStatus} </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tooltip.booking.status] || ''}`}>
                        {t.statusLabels[tooltip.booking.status] || tooltip.booking.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`/dashboard/host/bookings/${tooltip.booking.id}`} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <ExternalLink size={14} /> {t.tooltipDetails}
                    </a>
                    <a href={`/dashboard/host/bookings/${tooltip.booking.id}#messages`} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                      <MessageSquare size={14} /> {t.tooltipMessages}
                    </a>
                  </div>
                </div>
              )}

              {/* Blocked properties tooltip */}
              {blockedTooltip && (
                <div
                  data-tooltip
                  className="absolute bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 z-50"
                  style={{
                    bottom: gridRef.current ? gridRef.current.clientHeight - blockedTooltip.y : 0,
                    left: Math.min(Math.max(blockedTooltip.x, 0), gridRef.current ? gridRef.current.clientWidth - 200 : 0),
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-medium text-gray-500">{t.blockedFor}</p>
                    <button onClick={() => setBlockedTooltip(null)} className="text-gray-400 hover:text-gray-600 -mt-0.5 -mr-1">
                      <X size={14} />
                    </button>
                  </div>
                  {blockedTooltip.properties.map((name, i) => (
                    <p key={i} className="text-sm font-medium">{name}</p>
                  ))}
                </div>
              )}

              {/* Overflow tooltip — shows hidden bookings */}
              {overflowTooltip && (
                <div
                  data-tooltip
                  className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-72"
                  style={{
                    top: Math.min(overflowTooltip.y, (totalRows * (isMobile ? 80 : 112)) - 200),
                    left: Math.min(Math.max(overflowTooltip.x, 0), gridRef.current ? gridRef.current.clientWidth - 300 : 0),
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-sm">{t.otherBookings}</h4>
                    <button onClick={() => setOverflowTooltip(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {overflowTooltip.bookings.map(b => (
                      <a
                        key={b.id}
                        href={`/dashboard/host/bookings/${b.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{b.guest.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {format(parseISO(b.startDate), 'd MMM', { locale: dateFnsLocale })} – {format(parseISO(b.endDate), 'd MMM', { locale: dateFnsLocale })} · {b.property.title}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${STATUS_STYLES[b.status] || ''}`}>
                          {t.statusLabels[b.status] || b.status}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> {t.legendBlocked}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-200 border border-violet-400" /> {t.legendSynced}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 border-dashed" style={{borderStyle:'dashed'}} /> {lang === 'ro' ? 'Blocat extern' : 'External block'}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-600" /> {t.legendToday}</span>
              {/* TODO: re-add custom price legend when per-day pricing display is available to users
              {!isAllView && (
                <span className="flex items-center gap-1"><span className="text-emerald-600 font-medium">123</span> {t.legendCustomPrice}</span>
              )}
              */}
              {!isAllView && rangeStart && (
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200" /> {t.legendSelection}</span>
              )}
              {isAllView && properties.map((p, idx) => {
                const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded ${color.bg} border ${color.border}`} />
                    {p.title}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Calendar sync management */}
          {!isAllView && activePropId && (
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <RefreshCw size={16} /> {t.syncTitle}
                </h3>
              </div>

              {/* Export URL */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t.exportLinkDesc}</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/${activePropId}/calendar.ics`}
                    className="input text-xs flex-1 bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/properties/${activePropId}/calendar.ics`);
                      toast.success(t.linkCopied);
                    }}
                    className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
                  >
                    <Copy size={13} /> {t.copy}
                  </button>
                </div>
              </div>

              {/* Existing syncs */}
              {(calendarSyncs[activePropId] || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-gray-500">{t.connectedCalendars}</p>
                  {(calendarSyncs[activePropId] || []).map((sync: any) => (
                    <div key={sync.id} className="flex items-center gap-3 p-2.5 bg-violet-50 border border-violet-200 rounded-lg text-sm">
                      <Link2 size={14} className="text-violet-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium capitalize">{sync.platform}</span>
                        <p className="text-xs text-gray-500 truncate">{sync.icalUrl}</p>
                        {sync.lastSynced && (
                          <p className="text-[10px] text-gray-400">{t.lastSynced} {format(new Date(sync.lastSynced), 'd MMM HH:mm', { locale: dateFnsLocale })}</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          setSyncingId(sync.id);
                          try {
                            const res = await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ syncId: sync.id }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              await refreshCalendarData();
                              toast.success(t.syncSuccess(sync.platform, data.dates));
                            } else {
                              toast.error(data.error || t.syncError);
                            }
                          } catch {
                            toast.error(t.syncError);
                          }
                          setSyncingId(null);
                        }}
                        disabled={syncingId === sync.id}
                        className="text-violet-500 hover:text-violet-700 flex-shrink-0 p-1"
                        title={t.syncNow}
                      >
                        <RefreshCw size={14} className={syncingId === sync.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncId: sync.id }),
                          });
                          setCalendarSyncs(prev => ({
                            ...prev,
                            [activePropId]: (prev[activePropId] || []).filter((s: any) => s.id !== sync.id),
                          }));
                          // Remove synced blocked dates for this platform from local state
                          setSyncedDates(prev => {
                            const propDates = { ...prev[activePropId] };
                            Object.keys(propDates).forEach(d => {
                              if (propDates[d] === sync.platform) delete propDates[d];
                            });
                            return { ...prev, [activePropId]: propDates };
                          });
                          setBlockedDates(prev => {
                            const propBlocked = (prev[activePropId] || []).filter(d => syncedDates[activePropId]?.[d] !== sync.platform);
                            return { ...prev, [activePropId]: propBlocked };
                          });
                          toast.success(t.syncDisconnected(sync.platform));
                        }}
                        className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
                        title="Șterge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add sync form */}
              {showSyncForm ? (
                <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">{t.platform}</label>
                      <select value={syncPlatform} onChange={e => setSyncPlatform(e.target.value)} className="input text-sm">
                        <option value="booking">Booking.com</option>
                        <option value="airbnb">Airbnb</option>
                        <option value="other">{t.otherPlatform}</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">{t.icalUrl}</label>
                      <input
                        value={syncUrl}
                        onChange={e => setSyncUrl(e.target.value)}
                        placeholder="https://..."
                        className="input text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!syncUrl.trim()) return;
                        const res = await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ platform: syncPlatform, icalUrl: syncUrl.trim() }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setCalendarSyncs(prev => ({
                            ...prev,
                            [activePropId]: [...(prev[activePropId] || []), data.sync],
                          }));
                          setSyncUrl('');
                          setShowSyncForm(false);
                          toast.success(t.syncConnected(syncPlatform));
                        } else {
                          toast.error(data.error || t.addError);
                        }
                      }}
                      className="btn-primary text-xs px-4 py-2"
                    >
                      {t.add}
                    </button>
                    <button onClick={() => { setShowSyncForm(false); setSyncUrl(''); }} className="btn-secondary text-xs px-4 py-2">
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowSyncForm(true)} className="btn-secondary text-sm flex items-center gap-2">
                  <Plus size={14} /> {t.addExternalCalendar}
                </button>
              )}
            </div>
          )}

          {/* Action bar for range confirmation — fixed at bottom */}
          {rangeStart && !isAllView && !showPriceModal && (
            <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-lg bg-white border-t md:border md:rounded-xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  <p className="font-medium truncate">{activeProp?.title}</p>
                  <p className="text-gray-500 text-xs">
                    {t.daysSelected(rangeCount)}
                    {!rangeEnd && rangeStart && ` ${t.clickForRange}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* TODO: uncomment when period pricing is enabled
                  <button onClick={openPriceModal}
                    className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1.5">
                    <DollarSign size={13} /> {t.setPrice}
                  </button>
                  */}
                  <button onClick={() => {
                    const end = rangeEnd || rangeStart;
                    const [start, finish] = isBefore(parseISO(rangeStart!), parseISO(end!))
                      ? [rangeStart!, end!]
                      : [end!, rangeStart!];
                    setManualForm({
                      propertyId: activePropId || (properties[0]?.id || ''),
                      guestName: '', checkIn: start, checkOut: finish,
                      revenue: '', source: '', notes: '', blockCalendar: false,
                    });
                    setShowManualModal(true);
                  }}
                    className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5">
                    <Plus size={13} /> {lang === 'ro' ? 'Rezervare manuală' : 'Manual reservation'}
                  </button>
                  {!allBlocked && (
                    <button onClick={() => confirmBlock(true)} disabled={blocking}
                      className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                      <Lock size={13} /> {t.block}
                    </button>
                  )}
                  {hasAnyBlocked() && (
                    <button onClick={() => confirmBlock(false)} disabled={blocking}
                      className="px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5">
                      <Unlock size={13} /> {t.unblock}
                    </button>
                  )}
                  <button onClick={clearSelection}
                    className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Price setting modal */}
          {showPriceModal && rangeStart && !isAllView && (
            <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-md bg-white border-t md:border md:rounded-xl shadow-xl p-4 z-50">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{t.priceModalTitle}</h4>
                  <button onClick={() => setShowPriceModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {format(parseISO(rangeStart), 'd MMM', { locale: dateFnsLocale })}
                  {rangeEnd && rangeEnd !== rangeStart && ` — ${format(parseISO(rangeEnd), 'd MMM yyyy', { locale: dateFnsLocale })}`}
                  {!rangeEnd && ` — ${format(parseISO(rangeStart), 'yyyy', { locale: dateFnsLocale })}`}
                  {' '}({rangeCount} {rangeCount === 1 ? t.dayUnit : t.daysUnit})
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{t.periodNameLabel}</label>
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder={t.periodNamePh}
                    value={priceForm.name}
                    onChange={e => setPriceForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{t.pricePerNightLabel}</label>
                  <input
                    type="number"
                    className="input text-sm"
                    placeholder="ex. 350"
                    value={priceForm.pricePerNight}
                    onChange={e => setPriceForm(f => ({ ...f, pricePerNight: Number(e.target.value) }))}
                    min={1}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t.standardPrice(formatRON(activeProp?.pricePerNight || 0))}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={savePeriodPricing}
                  disabled={savingPrice}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {savingPrice ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> {t.saving}
                    </>
                  ) : (
                    <>
                      <DollarSign size={13} /> {t.save}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual reservation modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-base">{tm.newEntryTitle}</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">{tm.property}</label>
                  <select
                    className="input"
                    value={manualForm.propertyId}
                    onChange={e => setManualForm(f => ({ ...f, propertyId: e.target.value }))}
                  >
                    <option value="">{tm.selectProperty}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={manualForm.guestName}
                    onChange={e => setManualForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.source}</label>
                  <input className="input" placeholder={tm.sourcePlaceholder} value={manualForm.source}
                    onChange={e => setManualForm(f => ({ ...f, source: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkIn}</label>
                  <input type="date" className="input" value={manualForm.checkIn}
                    onChange={e => setManualForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkOut}</label>
                  <input type="date" className="input" value={manualForm.checkOut}
                    onChange={e => setManualForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.revenue}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                    value={manualForm.revenue} onChange={e => setManualForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={saveManualReservation}
                disabled={savingManual || !manualForm.propertyId || !manualForm.checkIn || !manualForm.checkOut || !manualForm.revenue}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                {savingManual ? tm.saving : tm.save}
              </button>
              <button onClick={() => setShowManualModal(false)} className="btn-secondary">{tm.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit synced reservation modal (read-only dates/source, editable guest/revenue/notes) */}
      {editingSynced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-base">
                  {lang === 'ro' ? 'Rezervare sincronizată' : 'Synced reservation'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{editingSynced.source}</p>
              </div>
              <button onClick={() => setEditingSynced(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Read-only dates */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkIn}</p>
                  <p className="text-sm font-medium">{format(parseISO(editingSynced.checkIn), 'd MMM yyyy', { locale: dateFnsLocale })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkOut}</p>
                  <p className="text-sm font-medium">{format(addDays(parseISO(editingSynced.checkOut), 1), 'd MMM yyyy', { locale: dateFnsLocale })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={editSyncedForm.guestName}
                    onChange={e => setEditSyncedForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.revenue}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                    value={editSyncedForm.revenue} onChange={e => setEditSyncedForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={editSyncedForm.notes} onChange={e => setEditSyncedForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              {/* Block / Reservation toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {lang === 'ro' ? 'Tip eveniment' : 'Event type'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'ro'
                      ? 'Suprascrie detectarea automată'
                      : 'Override automatic detection'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: false }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editSyncedForm.isBlockManual === false
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {lang === 'ro' ? 'Rezervare' : 'Reservation'}
                  </button>
                  <button
                    onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: true }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editSyncedForm.isBlockManual === true
                        ? 'bg-gray-200 text-gray-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {lang === 'ro' ? 'Blocat' : 'Block'}
                  </button>
                  {editSyncedForm.isBlockManual !== null && (
                    <button
                      onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: null }))}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
                      title={lang === 'ro' ? 'Resetează la automat' : 'Reset to automatic'}
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {lang === 'ro'
                  ? 'Datele și sursa sunt controlate de calendarul sincronizat și nu pot fi modificate.'
                  : 'Dates and source are controlled by the synced calendar and cannot be changed.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setEditingSynced(null)} className="btn-secondary">{tm.cancel}</button>
              <button onClick={saveSyncedEdit} disabled={savingSyncedEdit}
                className="btn-primary disabled:opacity-50 flex items-center gap-2">
                {savingSyncedEdit ? <><Loader2 size={14} className="animate-spin" /> {tm.saving}</> : tm.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit manual reservation modal */}
      {editingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-base">{tm.editEntryTitle}</h3>
              <button onClick={() => setEditingManual(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{tm.guestName}</label>
                  <input className="input" placeholder={tm.guestNamePlaceholder} value={editManualForm.guestName}
                    onChange={e => setEditManualForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.source}</label>
                  <input className="input" placeholder={tm.sourcePlaceholder} value={editManualForm.source}
                    onChange={e => setEditManualForm(f => ({ ...f, source: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkIn}</label>
                  <input type="date" className="input" value={editManualForm.checkIn}
                    onChange={e => setEditManualForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkOut}</label>
                  <input type="date" className="input" value={editManualForm.checkOut}
                    onChange={e => setEditManualForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.revenue}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                    value={editManualForm.revenue} onChange={e => setEditManualForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{tm.notes}</label>
                  <textarea className="input min-h-[60px] resize-none" placeholder={tm.notesPlaceholder}
                    value={editManualForm.notes} onChange={e => setEditManualForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5 border-t border-gray-100">
              <button onClick={deleteManualEdit} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition">
                <Trash2 size={14} /> {tm.deleteEntry}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditingManual(null)} className="btn-secondary">{tm.cancel}</button>
                <button onClick={saveManualEdit} disabled={savingManualEdit || !editManualForm.checkIn || !editManualForm.checkOut}
                  className="btn-primary disabled:opacity-50">
                  {savingManualEdit ? tm.saving : tm.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
