'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday, parseISO, isSameDay, isBefore, isAfter,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ExternalLink, MessageSquare, X, Lock, Unlock } from 'lucide-react';
import { formatRON } from '@/lib/utils';

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'În așteptare',
  ACCEPTED: 'Acceptată',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
};

export default function HostCalendarPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [activePropId, setActivePropId] = useState<string>('all');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ booking: BookingData; x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Range selection state
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const propDropdownRef = useRef<HTMLDivElement>(null);
  const [propDropdownOpen, setPropDropdownOpen] = useState(false);

  const isAllView = activePropId === 'all';
  const activeProp = properties.find(p => p.id === activePropId);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then(r => r.json());
      const data = await fetch('/api/properties?limit=100').then(r => r.json());
      const myProps = (data.properties || []).filter((p: any) => p.hostId === me.user?.userId);
      setProperties(myProps);

      const bookingData = await fetch('/api/bookings?role=host&limit=200').then(r => r.json());
      setBookings(bookingData.bookings || []);

      const blocked: Record<string, string[]> = {};
      for (const p of myProps) {
        const pd = await fetch(`/api/properties/${p.id}`).then(r => r.json());
        blocked[p.id] = (pd.property?.blockedDates || []).map((bd: any) => format(new Date(bd.date), 'yyyy-MM-dd'));
      }
      setBlockedDates(blocked);

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
      if (!target.closest('[data-tooltip]') && !target.closest('[data-pill]')) {
        setTooltip(null);
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

  const handleDateClick = useCallback((dateStr: string) => {
    if (isAllView) return;
    setConflictMsg(null);

    const booking = getBookingForDate(dateStr, activePropId);
    if (booking) {
      const guestName = booking.guest.name;
      const start = format(parseISO(booking.startDate), 'd MMM', { locale: ro });
      const end = format(parseISO(booking.endDate), 'd MMM', { locale: ro });
      const statusLabel = booking.status === 'ACCEPTED' ? 'acceptată' : 'în așteptare';
      setConflictMsg(`Nu poți bloca ${format(parseISO(dateStr), 'd MMMM', { locale: ro })} — există o rezervare ${statusLabel} de la ${guestName} (${start} – ${end}). Anulează rezervarea pentru a putea bloca această perioadă.`);
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
        const guestName = conflicting.guest.name;
        const start = format(parseISO(conflicting.startDate), 'd MMM', { locale: ro });
        const end = format(parseISO(conflicting.endDate), 'd MMM', { locale: ro });
        setConflictMsg(`Perioada selectată include o rezervare de la ${guestName} (${start} – ${end}). Anulează rezervarea pentru a putea bloca toată perioada.`);
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
  };

  const confirmBlock = async (block: boolean) => {
    if (isAllView || !rangeStart) return;
    const end = rangeEnd || rangeStart;
    const dates = getRangeDates(rangeStart, end);
    // Double-check: reject if any date has a booking
    const conflicting = dates.find(d => !!getBookingForDate(d, activePropId));
    if (conflicting) {
      setConflictMsg('Nu poți bloca o perioadă care include rezervări. Anulează rezervările mai întâi.');
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

  const handlePillClick = (e: React.MouseEvent<HTMLDivElement>, booking: BookingData) => {
    e.stopPropagation();
    const rect = gridRef.current?.getBoundingClientRect();
    const pillRect = e.currentTarget.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ booking, x: pillRect.left - rect.left, y: pillRect.bottom - rect.top + 4 });
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  const totalRows = Math.ceil((startPad + days.length) / 7);
  const previewDates = getPreviewDates();
  const propBlocked = !isAllView ? (blockedDates[activePropId] || []) : [];
  const blockedCount = propBlocked.length;
  const rangeCount = rangeStart ? getRangeDates(rangeStart, rangeEnd || rangeStart).length : 0;
  const allBlocked = isRangeAllBlocked();

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold mb-6">Calendar disponibilitate</h1>

      {properties.length === 0 ? (
        <p className="text-gray-500">Nu ai proprietăți.</p>
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
                  {isAllView ? 'Toate proprietățile' : activeProp?.title}
                </span>
                {!isAllView && blockedCount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                    {blockedCount} blocate
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
                    Toate proprietățile
                    <span className="text-xs text-gray-400 ml-auto">vizualizare</span>
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
                          {propBlockedCount} blocate
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
                Click pe o dată sau selectează o perioadă pentru a bloca/debloca zile.
                {blockedCount > 0 && <span className="text-red-500 ml-1">({blockedCount} zile blocate)</span>}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Vizualizare generală. Selectează o proprietate pentru a gestiona disponibilitatea.
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
              <h3 className="text-lg font-semibold capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ro })}</h3>
              <button onClick={() => { setCurrentMonth(m => addMonths(m, 1)); clearSelection(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0 text-center text-xs md:text-sm font-medium text-gray-500 mb-1 border-b border-gray-200 pb-2">
              {[
                { short: 'Lu', full: 'Luni' },
                { short: 'Ma', full: 'Marți' },
                { short: 'Mi', full: 'Miercuri' },
                { short: 'Jo', full: 'Joi' },
                { short: 'Vi', full: 'Vineri' },
                { short: 'Sâ', full: 'Sâmbătă' },
                { short: 'Du', full: 'Duminică' },
              ].map(d => (
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
                  // In "all" view, show blocked if any property has it blocked
                  const isBlockedAny = isAllView && properties.some(p => (blockedDates[p.id] || []).includes(dateStr));
                  const isInPreview = !isAllView && previewDates.has(dateStr);
                  const isRangeEdge = dateStr === rangeStart || dateStr === rangeEnd;
                  const hasAcceptedBooking = !isAllView && !!getBookingForDate(dateStr, activePropId);
                  const canClick = !isAllView && (!hasAcceptedBooking || getBookingForDate(dateStr, activePropId)?.status !== 'ACCEPTED');

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
                        ${(isBlockedHere || isBlockedAny) && !isInPreview ? 'bg-red-50' : ''}
                        ${isInPreview && !isBlockedHere ? 'bg-indigo-50' : ''}
                        ${isInPreview && isBlockedHere ? 'bg-red-100' : ''}
                        ${hasAcceptedBooking && !isAllView ? 'cursor-not-allowed' : ''}
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
                      {/* Blocked indicator */}
                      {isBlockedHere && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] text-red-400 font-medium">blocat</span>
                      )}
                      {/* In "all" view, show which properties have this date blocked */}
                      {isAllView && (() => {
                        const blockedProps = properties.filter(p => (blockedDates[p.id] || []).includes(dateStr));
                        if (!blockedProps.length) return null;
                        return (
                          <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
                            {blockedProps.map((p, idx) => {
                              const color = getPropertyColor(p.id);
                              return <span key={p.id} className={`w-2 h-2 rounded-full ${color.bg} ${color.border} border`} title={`${p.title} — blocat`} />;
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
                          className="absolute px-1 text-[10px] md:text-xs font-semibold text-gray-600 truncate"
                          style={{ top: `${top}px`, left, width, height: `${pillH}px`, lineHeight: `${pillH}px`, zIndex: 20 }}
                        >
                          +{count}
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
                    <p><span className="text-gray-500">Oaspete:</span> {tooltip.booking.guest.name}</p>
                    <p><span className="text-gray-500">Perioada:</span> {format(parseISO(tooltip.booking.startDate), 'd MMM', { locale: ro })} – {format(parseISO(tooltip.booking.endDate), 'd MMM yyyy', { locale: ro })}</p>
                    <p><span className="text-gray-500">Oaspeți:</span> {tooltip.booking.guests}</p>
                    <p><span className="text-gray-500">Total:</span> {formatRON(tooltip.booking.totalPrice)}</p>
                    <p>
                      <span className="text-gray-500">Status: </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tooltip.booking.status] || ''}`}>
                        {STATUS_LABELS[tooltip.booking.status] || tooltip.booking.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`/dashboard/host/bookings/${tooltip.booking.id}`} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <ExternalLink size={14} /> Detalii
                    </a>
                    <a href={`/dashboard/host/bookings/${tooltip.booking.id}#messages`} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                      <MessageSquare size={14} /> Mesaje
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Blocat</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-600" /> Azi</span>
              {!isAllView && rangeStart && (
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200" /> Selecție</span>
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

          {/* Action bar for range confirmation — fixed at bottom */}
          {rangeStart && !isAllView && (
            <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-md bg-white border-t md:border md:rounded-xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  <p className="font-medium truncate">{activeProp?.title}</p>
                  <p className="text-gray-500 text-xs">
                    {rangeCount} {rangeCount === 1 ? 'zi selectată' : 'zile selectate'}
                    {!rangeEnd && rangeStart && ' — click altă dată pentru perioadă'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!allBlocked && (
                    <button onClick={() => confirmBlock(true)} disabled={blocking}
                      className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                      <Lock size={13} /> Blochează
                    </button>
                  )}
                  {hasAnyBlocked() && (
                    <button onClick={() => confirmBlock(false)} disabled={blocking}
                      className="px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5">
                      <Unlock size={13} /> Deblochează
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
        </>
      )}
    </div>
  );
}
