'use client';

import { useEffect, useCallback } from 'react';
import { useDropdown } from '@/hooks/useDropdown';
import {
  format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, parseISO, isSameDay, isBefore, isAfter, isWithinInterval,
} from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { X, Lock, Unlock, RefreshCw, Trash2, Copy, Plus, DollarSign, Loader2, ChevronRight } from 'lucide-react';
import { formatRON } from '@/lib/utils';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';
import { useCalendarState } from './useCalendarState';
import { useCalendarData } from './useCalendarData';
import { BookingData, ManualReservationData, SyncedReservationData } from '@/types';
import { CalendarGrid, PROPERTY_COLORS } from './CalendarGrid';

const SYNC_COLOR_PALETTE = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#6366f1','#8b5cf6','#ec4899','#64748b'];

export default function HostCalendarPage() {
  const lang = useLang();
  const t = dashboardT[lang].calendar;
  const dateFnsLocale = lang === 'ro' ? ro : enUS;
  // UI state (from useCalendarState hook)
  const {
    activePropId, setActivePropId,
    currentMonth, setCurrentMonth,
    isMobile, setIsMobile,
    tooltip, setTooltip,
    overflowTooltip, setOverflowTooltip,
    blockedTooltip, setBlockedTooltip,
    editingManual, setEditingManual,
    editManualForm, setEditManualForm,
    savingManualEdit, setSavingManualEdit,
    editingSynced, setEditingSynced,
    editSyncedForm, setEditSyncedForm,
    showSyncedBlockWarn, setShowSyncedBlockWarn,
    savingSyncedEdit, setSavingSyncedEdit,
    rangeStart, setRangeStart,
    rangeEnd, setRangeEnd,
    hoverDate, setHoverDate,
    blocking, setBlocking,
    conflictMsg, setConflictMsg,
    showSyncForm, setShowSyncForm,
    syncPlatform, setSyncPlatform,
    syncUrl, setSyncUrl,
    syncColor, setSyncColor,
    syncingId, setSyncingId,
    showPriceModal, setShowPriceModal,
    priceForm, setPriceForm,
    savingPrice, setSavingPrice,
    showManualModal, setShowManualModal,
    manualForm, setManualForm,
    savingManual, setSavingManual,
  } = useCalendarState();

  // Data-fetching state (from useCalendarData hook)
  const {
    properties, bookings, manualReservations, syncedReservations,
    manualBlockedDates, blockedDates, syncedDates, calendarSyncs,
    periodPricings, loading,
    refetch: refreshCalendarData,
    setBlockedDates, setSyncedDates, setCalendarSyncs, setPeriodPricings,
  } = useCalendarData((id) => setActivePropId(id));

  const tm = dashboardT[lang].manualReservation;

  const { open: propDropdownOpen, setOpen: setPropDropdownOpen, ref: propDropdownRef } = useDropdown();

  const isAllView = activePropId === 'all';
  const activeProp = properties.find(p => p.id === activePropId);

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
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPropertyColor = (propertyId: string) => {
    const idx = properties.findIndex(p => p.id === propertyId);
    return PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
  };

  const getSyncColor = useCallback((propertyId: string, source: string): string => {
    const sync = (calendarSyncs[propertyId] || []).find((s: any) => s.platform === source);
    return sync?.color || '#6366f1';
  }, [calendarSyncs]);

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
          revenue: editSyncedForm.isBlockManual === true ? 0 : (parseFloat(editSyncedForm.revenue) || 0),
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
          <CalendarGrid
            days={days}
            startPad={startPad}
            totalRows={totalRows}
            monthStart={monthStart}
            monthEnd={monthEnd}
            currentMonth={currentMonth}
            visibleBookings={visibleBookings}
            manualReservations={manualReservations}
            syncedReservations={syncedReservations}
            properties={properties}
            blockedDates={blockedDates}
            manualBlockedDates={manualBlockedDates}
            syncedDates={syncedDates}
            calendarSyncs={calendarSyncs}
            propBlocked={propBlocked}
            previewDates={previewDates}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            tooltip={tooltip}
            overflowTooltip={overflowTooltip}
            blockedTooltip={blockedTooltip}
            setTooltip={setTooltip}
            setOverflowTooltip={setOverflowTooltip}
            setBlockedTooltip={setBlockedTooltip}
            isAllView={isAllView}
            isMobile={isMobile}
            lang={lang}
            dateFnsLocale={dateFnsLocale}
            activePropId={activePropId}
            handleDateClick={handleDateClick}
            setHoverDate={setHoverDate}
            openEditManual={openEditManual}
            openEditSynced={openEditSynced}
            getPropertyColor={getPropertyColor}
            getSyncColor={getSyncColor}
            setCurrentMonth={setCurrentMonth}
            clearSelection={clearSelection}
            t={t}
            getPillInfo={getPillInfo}
            getManualPillInfo={getManualPillInfo}
            getSyncedPillInfo={getSyncedPillInfo}
          />

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
                    <div key={sync.id} className="flex flex-col gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sync.color || '#6366f1' }} />
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
                      {/* Color picker row */}
                      <div className="flex items-center gap-1.5 pl-6">
                        <span className="text-[10px] text-gray-400 mr-0.5">{lang === 'ro' ? 'Culoare:' : 'Color:'}</span>
                        {SYNC_COLOR_PALETTE.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ syncId: sync.id, color: c }),
                              });
                              setCalendarSyncs(prev => ({
                                ...prev,
                                [activePropId]: (prev[activePropId] || []).map((s: any) =>
                                  s.id === sync.id ? { ...s, color: c } : s
                                ),
                              }));
                            }}
                            className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                            style={{ backgroundColor: c, outline: (sync.color || '#6366f1') === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                          />
                        ))}
                      </div>
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
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">{lang === 'ro' ? 'Culoare calendar' : 'Calendar color'}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SYNC_COLOR_PALETTE.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSyncColor(c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                          style={{ backgroundColor: c, outline: syncColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!syncUrl.trim()) return;
                        const res = await fetch(`/api/properties/${activePropId}/calendar-sync`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ platform: syncPlatform, icalUrl: syncUrl.trim(), color: syncColor }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setCalendarSyncs(prev => ({
                            ...prev,
                            [activePropId]: [...(prev[activePropId] || []), data.sync],
                          }));
                          setSyncUrl('');
                          setSyncColor('#6366f1');
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
                {editSyncedForm.isBlockManual !== true && (
                  <div className="sm:col-span-2">
                    <label className="label">{tm.revenue}</label>
                    <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                      value={editSyncedForm.revenue} onChange={e => setEditSyncedForm(f => ({ ...f, revenue: e.target.value }))} />
                  </div>
                )}
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
                    onClick={() => {
                      if (parseFloat(editSyncedForm.revenue) > 0) {
                        setShowSyncedBlockWarn(true);
                      } else {
                        setEditSyncedForm(f => ({ ...f, isBlockManual: true }));
                      }
                    }}
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

      {/* Revenue removal warning modal */}
      {showSyncedBlockWarn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-base mb-2">
              {lang === 'ro' ? 'Elimini venitul?' : 'Remove revenue?'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {lang === 'ro'
                ? `Dacă marchezi aceste date ca blocate, venitul de ${formatRON(parseFloat(editSyncedForm.revenue))} va fi eliminat și nu va fi inclus în rapoarte.`
                : `Marking this as blocked will remove the revenue of ${formatRON(parseFloat(editSyncedForm.revenue))} and exclude it from reports.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSyncedBlockWarn(false)} className="btn-secondary text-sm">
                {tm.cancel}
              </button>
              <button
                onClick={() => {
                  setEditSyncedForm(f => ({ ...f, isBlockManual: true, revenue: '0' }));
                  setShowSyncedBlockWarn(false);
                }}
                className="btn-primary text-sm"
              >
                {lang === 'ro' ? 'Confirmă' : 'Confirm'}
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
