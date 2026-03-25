'use client';

import { useEffect, useCallback } from 'react';
import { useDropdown } from '@/hooks/useDropdown';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, parseISO, isSameDay, isBefore, isAfter, isWithinInterval,
} from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { X, Lock, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';
import { useCalendarState } from './useCalendarState';
import { useCalendarData } from './useCalendarData';
import { BookingData, ManualReservationData, SyncedReservationData } from '@/types';
import { CalendarGrid, PROPERTY_COLORS } from './CalendarGrid';
import { CalendarSidebar } from './CalendarSidebar';

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

          <CalendarSidebar
            activePropId={activePropId}
            activeProp={activeProp}
            isAllView={isAllView}
            properties={properties}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            rangeCount={rangeCount}
            blocking={blocking}
            allBlocked={allBlocked}
            hasAnyBlocked={hasAnyBlocked}
            calendarSyncs={calendarSyncs}
            syncingId={syncingId}
            setSyncingId={setSyncingId}
            setCalendarSyncs={setCalendarSyncs}
            setSyncedDates={setSyncedDates}
            setBlockedDates={setBlockedDates}
            syncedDates={syncedDates}
            showSyncForm={showSyncForm}
            setShowSyncForm={setShowSyncForm}
            syncPlatform={syncPlatform}
            setSyncPlatform={setSyncPlatform}
            syncUrl={syncUrl}
            setSyncUrl={setSyncUrl}
            syncColor={syncColor}
            setSyncColor={setSyncColor}
            confirmBlock={confirmBlock}
            clearSelection={clearSelection}
            setManualForm={setManualForm}
            setShowManualModal={setShowManualModal}
            showPriceModal={showPriceModal}
            setShowPriceModal={setShowPriceModal}
            priceForm={priceForm}
            setPriceForm={setPriceForm}
            savingPrice={savingPrice}
            savePeriodPricing={savePeriodPricing}
            showManualModal={showManualModal}
            manualForm={manualForm}
            savingManual={savingManual}
            saveManualReservation={saveManualReservation}
            editingSynced={editingSynced}
            setEditingSynced={setEditingSynced}
            editSyncedForm={editSyncedForm}
            setEditSyncedForm={setEditSyncedForm}
            showSyncedBlockWarn={showSyncedBlockWarn}
            setShowSyncedBlockWarn={setShowSyncedBlockWarn}
            savingSyncedEdit={savingSyncedEdit}
            saveSyncedEdit={saveSyncedEdit}
            editingManual={editingManual}
            setEditingManual={setEditingManual}
            editManualForm={editManualForm}
            setEditManualForm={setEditManualForm}
            savingManualEdit={savingManualEdit}
            saveManualEdit={saveManualEdit}
            deleteManualEdit={deleteManualEdit}
            lang={lang}
            dateFnsLocale={dateFnsLocale}
            t={t}
            tm={tm}
            refreshCalendarData={refreshCalendarData}
          />
        </>
      )}
    </div>
  );
}
