'use client';

import { useRef } from 'react';
import {
  format, addMonths, isSameDay, isToday, parseISO, isBefore, isAfter,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink, MessageSquare, X } from 'lucide-react';
import { hexToRgba, formatRON } from '@/lib/utils';
import { BookingData, ManualReservationData, SyncedReservationData, CalendarSync } from '@/types';
import { Locale } from 'date-fns';

// ---------------------------------------------------------------------------
// Types shared with the parent
// ---------------------------------------------------------------------------

type PropertySummaryWithPrice = {
  id: string;
  title: string;
  pricePerNight: number;
};

type TooltipState = {
  booking: BookingData;
  x: number;
  y: number;
} | null;

type OverflowTooltipState = {
  bookings: BookingData[];
  x: number;
  y: number;
} | null;

type BlockedTooltipState = {
  properties: string[];
  x: number;
  y: number;
} | null;

// Row segment used by pill layout helpers
type PillRow = { row: number; colStart: number; colEnd: number };

// ---------------------------------------------------------------------------
// Constants (duplicated here so the component is self-contained)
// ---------------------------------------------------------------------------

export const PROPERTY_COLORS = [
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CalendarGridProps {
  // Calendar data
  days: Date[];
  startPad: number;
  totalRows: number;
  monthStart: Date;
  monthEnd: Date;
  currentMonth: Date;
  visibleBookings: BookingData[];
  manualReservations: ManualReservationData[];
  syncedReservations: SyncedReservationData[];
  properties: PropertySummaryWithPrice[];
  blockedDates: Record<string, string[]>;
  manualBlockedDates: Record<string, Set<string>>;
  syncedDates: Record<string, Record<string, string>>;
  calendarSyncs: Record<string, CalendarSync[]>;
  propBlocked: string[];
  previewDates: Set<string>;
  rangeStart: string | null;
  rangeEnd: string | null;

  // Tooltip state
  tooltip: TooltipState;
  overflowTooltip: OverflowTooltipState;
  blockedTooltip: BlockedTooltipState;
  setTooltip: (v: TooltipState) => void;
  setOverflowTooltip: (v: OverflowTooltipState) => void;
  setBlockedTooltip: (v: BlockedTooltipState) => void;

  // Interaction
  isAllView: boolean;
  isMobile: boolean;
  lang: string;
  dateFnsLocale: Locale;
  activePropId: string;

  // Callbacks
  handleDateClick: (dateStr: string) => void;
  setHoverDate: (d: string | null) => void;
  openEditManual: (mr: ManualReservationData, e: React.MouseEvent) => void;
  openEditSynced: (sr: SyncedReservationData, e?: React.MouseEvent) => void;
  getPropertyColor: (propertyId: string) => typeof PROPERTY_COLORS[number];
  getSyncColor: (propertyId: string, source: string) => string;

  // Navigation
  setCurrentMonth: (fn: (m: Date) => Date) => void;
  clearSelection: () => void;

  // Translations
  t: {
    dayHeaders: { short: string; full: string }[];
    blockedLabel: string;
    blockedFor: string;
    tooltipGuest: string;
    tooltipPeriod: string;
    tooltipGuests: string;
    tooltipTotal: string;
    tooltipStatus: string;
    tooltipDetails: string;
    tooltipMessages: string;
    statusLabels: Record<string, string>;
    otherBookings: string;
    legendBlocked: string;
    legendSynced: string;
    legendToday: string;
    legendSelection: string;
    lastSynced: string;
  };

  // Pill layout helpers (depend on monthStart/monthEnd/startPad/days — passed as callbacks to avoid recalc)
  getPillInfo: (booking: BookingData) => PillRow[];
  getManualPillInfo: (mr: ManualReservationData) => PillRow[];
  getSyncedPillInfo: (sr: SyncedReservationData) => PillRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarGrid({
  days,
  startPad,
  totalRows,
  monthStart,
  monthEnd,
  currentMonth,
  visibleBookings,
  manualReservations,
  syncedReservations,
  properties,
  blockedDates,
  manualBlockedDates,
  syncedDates,
  calendarSyncs,
  propBlocked,
  previewDates,
  rangeStart,
  rangeEnd,
  tooltip,
  overflowTooltip,
  blockedTooltip,
  setTooltip,
  setOverflowTooltip,
  setBlockedTooltip,
  isAllView,
  isMobile,
  lang,
  dateFnsLocale,
  activePropId,
  handleDateClick,
  setHoverDate,
  openEditManual,
  openEditSynced,
  getPropertyColor,
  getSyncColor,
  setCurrentMonth,
  clearSelection,
  t,
  getPillInfo,
  getManualPillInfo,
  getSyncedPillInfo,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="card">
      {/* Month navigation */}
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
            const hasAcceptedBooking = !isAllView && !!visibleBookings.find(b => b.property.id === activePropId && b.status === 'ACCEPTED' && dateStr >= b.startDate.split('T')[0] && dateStr <= b.endDate.split('T')[0]);
            const canClick = !isAllView && !isSynced && !isManualBlocked && (!hasAcceptedBooking);

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
          const pillSegments: { booking: BookingData; bookingIdx: number; pr: PillRow; ri: number; stackIndex: number }[] = [];

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
          const manualPillSegments: { mr: ManualReservationData; pr: PillRow; ri: number; stackIndex: number }[] = [];
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

          const syncedPillSegments: { sr: SyncedReservationData; pr: PillRow; ri: number; stackIndex: number }[] = [];
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = gridRef.current?.getBoundingClientRect();
                      const pillRect = e.currentTarget.getBoundingClientRect();
                      if (!rect) return;
                      setTooltip({ booking: seg.booking, x: pillRect.left - rect.left, y: pillRect.bottom - rect.top + 4 });
                    }}
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
                    title={`${label}${isAllView ? ` · ${properties.find(p => p.id === seg.mr.propertyId)?.title || ''}` : ''}`}
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
                const syncColorHex = getSyncColor(seg.sr.propertyId, seg.sr.source || '');
                const pillColorStyle = isBlock
                  ? { backgroundColor: hexToRgba(syncColorHex, 0.1), borderColor: hexToRgba(syncColorHex, 0.45), color: syncColorHex, borderStyle: 'dashed' as const }
                  : { backgroundColor: hexToRgba(syncColorHex, 0.2), borderColor: syncColorHex, color: syncColorHex };
                const pillClass = 'absolute border rounded-md px-1 md:px-2 py-0 md:py-0.5 text-[10px] md:text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity';
                return (
                  <div
                    key={`synced-${seg.sr.id}-${seg.ri}`}
                    data-pill
                    onClick={(e) => openEditSynced(seg.sr, e)}
                    className={pillClass}
                    style={{ top: `${top}px`, left, width, height: `${pillH}px`, zIndex: 10 + seg.stackIndex, ...pillColorStyle }}
                    title={`${label}${propTitle ? ` · ${propTitle}` : ''}`}
                  >
                    {isMobile ? label?.split(' ')[0] : label}
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
        {!isAllView && (calendarSyncs[activePropId] || []).map((sync: CalendarSync) => (
          <span key={sync.id} className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border" style={{ backgroundColor: hexToRgba(sync.color, 0.2), borderColor: sync.color ?? undefined }} />
              <span className="capitalize">{sync.platform}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border" style={{ backgroundColor: hexToRgba(sync.color, 0.1), borderColor: hexToRgba(sync.color, 0.45), borderStyle: 'dashed' }} />
              <span>{lang === 'ro' ? 'blocat' : 'blocked'}</span>
            </span>
          </span>
        ))}
        {!isAllView && (calendarSyncs[activePropId] || []).length === 0 && (
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-200 border border-violet-400" /> {t.legendSynced}</span>
        )}
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-600" /> {t.legendToday}</span>
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
  );
}
