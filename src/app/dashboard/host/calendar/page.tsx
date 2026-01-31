'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday, parseISO, isSameDay, isBefore, isAfter, isWithinInterval
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ExternalLink, MessageSquare, X } from 'lucide-react';
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
  REJECTED: 'Respinsă',
  CANCELLED: 'Anulată',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function HostCalendarPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ booking: BookingData; x: number; y: number } | null>(null);
  const [overflow, setOverflow] = useState<{ row: number; col: number; bookings: BookingData[]; x: number; y: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load properties and bookings
  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then(r => r.json());
      const data = await fetch('/api/properties?limit=100').then(r => r.json());
      const myProps = (data.properties || []).filter((p: any) => p.hostId === me.user?.userId);
      setProperties(myProps);
      // Select all by default
      setSelectedProps(new Set(myProps.map((p: any) => p.id)));

      // Fetch host bookings
      const bookingData = await fetch('/api/bookings?role=host').then(r => r.json());
      setBookings(bookingData.bookings || []);

      // Fetch blocked dates for all properties
      const blocked: Record<string, string[]> = {};
      for (const p of myProps) {
        const pd = await fetch(`/api/properties/${p.id}`).then(r => r.json());
        blocked[p.id] = (pd.property?.blockedDates || []).map((bd: any) => format(new Date(bd.date), 'yyyy-MM-dd'));
      }
      setBlockedDates(blocked);

      setLoading(false);
    })();
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close tooltip and dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-tooltip]') && !target.closest('[data-pill]')) {
        setTooltip(null);
      }
      if (!target.closest('[data-overflow]') && !target.closest('[data-more]')) {
        setOverflow(null);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleProperty = (id: string) => {
    setSelectedProps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedProps.size === properties.length) {
      setSelectedProps(new Set());
    } else {
      setSelectedProps(new Set(properties.map(p => p.id)));
    }
  };

  const getPropertyColor = (propertyId: string) => {
    const idx = properties.findIndex(p => p.id === propertyId);
    return PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
  };

  const toggleDate = async (propertyId: string, dateStr: string) => {
    const propBlocked = blockedDates[propertyId] || [];
    const isBlocked = propBlocked.includes(dateStr);
    await fetch(`/api/properties/${propertyId}/blocked-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: [dateStr], block: !isBlocked }),
    });
    setBlockedDates(prev => ({
      ...prev,
      [propertyId]: isBlocked ? propBlocked.filter(d => d !== dateStr) : [...propBlocked, dateStr],
    }));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  // Get bookings visible in the current month for selected properties
  const visibleBookings = bookings.filter(b => {
    if (!selectedProps.has(b.property.id)) return false;
    if (b.status === 'REJECTED' || b.status === 'CANCELLED') return false;
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    return !(isAfter(start, monthEnd) || isBefore(end, monthStart));
  });

  // Build pill rows: for each booking, compute which days in the grid it occupies
  const getPillInfo = (booking: BookingData) => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    const clampedStart = isBefore(start, monthStart) ? monthStart : start;
    const clampedEnd = isAfter(end, monthEnd) ? monthEnd : end;

    const startIdx = startPad + days.findIndex(d => isSameDay(d, clampedStart));
    const endIdx = startPad + days.findIndex(d => isSameDay(d, clampedEnd));

    // Split into week rows
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
    const x = pillRect.left - rect.left;
    const y = pillRect.bottom - rect.top + 4;
    setTooltip({ booking, x, y });
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  const totalRows = Math.ceil((startPad + days.length) / 7);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendar disponibilitate</h1>

      {properties.length === 0 ? (
        <p className="text-gray-500">Nu ai proprietăți.</p>
      ) : (
        <>
          {/* Property dropdown multi-select */}
          <div className="mb-6 relative" ref={dropdownRef}>
            <label className="label mb-2 block">Proprietăți</label>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className="input text-left flex items-center justify-between w-full md:max-w-md"
            >
              <span className="truncate">
                {selectedProps.size === properties.length
                  ? 'Toate proprietățile'
                  : selectedProps.size === 0
                    ? 'Selectează proprietăți'
                    : `${selectedProps.size} ${selectedProps.size === 1 ? 'proprietate selectată' : 'proprietăți selectate'}`}
              </span>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-30 mt-1 w-full md:max-w-md bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedProps.size === properties.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Toate proprietățile</span>
                </label>
                {properties.map((p, idx) => {
                  const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
                  return (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedProps.has(p.id)}
                        onChange={() => toggleProperty(p.id)}
                        className="rounded border-gray-300"
                      />
                      <span className={`inline-block w-3 h-3 rounded-sm ${color.bg} ${color.border} border flex-shrink-0`} />
                      <span className="truncate">{p.title}</span>
                    </label>
                  );
                })}
                <div className="flex gap-2 px-3 py-2 border-t border-gray-100 mt-1">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(false)}
                    className="btn-primary text-xs px-3 py-1.5 flex-1"
                  >
                    Aplică
                  </button>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(false)}
                    className="btn-outline text-xs px-3 py-1.5 flex-1"
                  >
                    Închide
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="card" ref={calendarRef}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={22} />
              </button>
              <h3 className="text-lg font-semibold capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ro })}</h3>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
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

            {/* Calendar grid with pills */}
            <div className="relative" ref={gridRef}>
              <div className="grid grid-cols-7 gap-0">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-20 md:h-28 border-b border-r border-gray-100" />
                ))}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isBlockedForAny = Array.from(selectedProps).some(pid => (blockedDates[pid] || []).includes(dateStr));
                  return (
                    <div
                      key={dateStr}
                      className={`h-20 md:h-28 border-b border-r border-gray-100 p-0.5 md:p-1 text-right ${
                        isToday(day) ? 'bg-primary-50' : ''
                      } ${isBlockedForAny ? 'bg-red-50' : ''}`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm rounded-full ${
                        isToday(day) ? 'bg-primary-600 text-white font-bold' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reservation pill overlays with overflow handling */}
              {(() => {
                const pillH = isMobile ? 18 : 22;
                const pillGap = 2;
                const cellH = isMobile ? 80 : 112;
                const pillOffset = isMobile ? 26 : 30;
                const maxSlots = Math.floor((cellH - pillOffset) / (pillH + pillGap));

                // Build per-row slot assignments: for each booking segment, assign a stackIndex
                // and track which bookings are in each (row, col) cell
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
                    // Register in each cell this segment spans
                    for (let c = pr.colStart; c <= pr.colEnd; c++) {
                      const key = `${pr.row}-${c}`;
                      if (!cellBookings.has(key)) cellBookings.set(key, []);
                      cellBookings.get(key)!.push({ booking, stackIndex });
                    }
                  });
                });

                // For each cell, determine how many bookings overflow
                const overflowCells: Map<string, BookingData[]> = new Map();
                cellBookings.forEach((entries, key) => {
                  if (entries.length > maxSlots) {
                    overflowCells.set(key, entries.map(e => e.booking));
                  }
                });

                // Determine which bookings to fully hide:
                // If a booking overflows in ANY cell of ANY row, hide ALL its segments across all rows.
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

                // Find which cells need a "+N" badge — any cell that contains a globally hidden booking
                const badgeCells: Map<string, { row: number; col: number; count: number; bookings: BookingData[] }> = new Map();
                cellBookings.forEach((entries, key) => {
                  const hiddenInCell = entries
                    .filter(e => globallyHiddenBookings.has(e.booking.id))
                    .map(e => e.booking);
                  const unique = Array.from(new Map(hiddenInCell.map(b => [b.id, b])).values());
                  if (unique.length > 0) {
                    const [row, col] = key.split('-').map(Number);
                    badgeCells.set(key, { row, col, count: unique.length, bookings: unique });
                  }
                });

                return (
                  <>
                    {pillSegments.filter(seg => !hiddenPills.has(`${seg.booking.id}-${seg.ri}`)).map(seg => {
                      const color = getPropertyColor(seg.booking.property.id);
                      const top = (seg.pr.row * cellH) + pillOffset + seg.stackIndex * (pillH + pillGap);
                      const left = `${(seg.pr.colStart / 7) * 100}%`;
                      const width = `${((seg.pr.colEnd - seg.pr.colStart + 1) / 7) * 100}%`;
                      return (
                        <div
                          key={`${seg.booking.id}-${seg.ri}`}
                          data-pill
                          onClick={(e) => handlePillClick(e, seg.booking)}
                          className={`absolute ${color.pill} border rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{
                            top: `${top}px`,
                            left,
                            width,
                            height: `${pillH}px`,
                            zIndex: 10 + seg.stackIndex,
                          }}
                          title={`${seg.booking.guest.name} - ${seg.booking.property.title}`}
                        >
                          {isMobile ? seg.booking.guest.name.split(' ')[0] : seg.booking.guest.name} {!isMobile && selectedProps.size > 1 && `· ${seg.booking.property.title}`}
                        </div>
                      );
                    })}

                    {/* "+N more" badges */}
                    {Array.from(badgeCells.values()).map(({ row, col, count, bookings: cellBk }) => {
                      const top = (row * cellH) + pillOffset + (maxSlots - 1) * (pillH + pillGap);
                      const left = `${(col / 7) * 100}%`;
                      const width = `${(1 / 7) * 100}%`;
                      return (
                        <div
                          key={`more-${row}-${col}`}
                          data-more
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = gridRef.current?.getBoundingClientRect();
                            const btnRect = e.currentTarget.getBoundingClientRect();
                            if (!rect) return;
                            setOverflow({
                              row, col,
                              bookings: cellBk,
                              x: btnRect.left - rect.left,
                              y: btnRect.bottom - rect.top + 4,
                            });
                          }}
                          className="absolute px-1 text-[10px] md:text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 truncate"
                          style={{
                            top: `${top}px`,
                            left,
                            width,
                            height: `${pillH}px`,
                            lineHeight: `${pillH}px`,
                            zIndex: 20,
                          }}
                        >
                          +{count} mai mult
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
                    top: Math.min(tooltip.y, (totalRows * 112) - 200),
                    left: Math.min(tooltip.x, gridRef.current ? gridRef.current.clientWidth - 300 : 0),
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
                    <a
                      href={`/dashboard/host/bookings/${tooltip.booking.id}`}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> Detalii rezervare
                    </a>
                    <a
                      href={`/dashboard/host/bookings/${tooltip.booking.id}#messages`}
                      className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <MessageSquare size={14} /> Mesaje
                    </a>
                  </div>
                </div>
              )}

              {/* Overflow popover */}
              {overflow && (
                <div
                  data-overflow
                  className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 w-64"
                  style={{
                    top: Math.min(overflow.y, (totalRows * (isMobile ? 80 : 112)) - 150),
                    left: Math.min(overflow.x, gridRef.current ? gridRef.current.clientWidth - 270 : 0),
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-xs text-gray-500">Toate rezervările</h4>
                    <button onClick={() => setOverflow(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {overflow.bookings.map(b => {
                      const color = getPropertyColor(b.property.id);
                      return (
                        <div
                          key={b.id}
                          data-pill
                          onClick={(e) => { setOverflow(null); handlePillClick(e, b); }}
                          className={`${color.pill} border rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:opacity-80 truncate`}
                        >
                          {b.guest.name} {selectedProps.size > 1 && `· ${b.property.title}`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Dată blocată</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-600" /> Azi</span>
              {properties.filter(p => selectedProps.has(p.id)).map((p, idx) => {
                const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded ${color.bg} border ${color.border}`} />
                    {p.title}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click pe o rezervare pentru detalii.</p>
          </div>
        </>
      )}
    </div>
  );
}
