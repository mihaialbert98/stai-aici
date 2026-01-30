'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isBefore, isAfter, isSameDay,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DateRangePicker.module.scss';

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  placeholder?: string;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function DateRangePicker({ startDate, endDate, onChange, placeholder = 'Selectează perioada' }: Props) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [phase, setPhase] = useState<'start' | 'end'>('start');
  const ref = useRef<HTMLDivElement>(null);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const today = localToday();

  // Close on outside click (desktop only — mobile uses backdrop)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleDayClick = useCallback((day: Date) => {
    if (isBefore(day, today)) return;

    if (phase === 'start') {
      onChange(toDateStr(day), '');
      setPhase('end');
    } else {
      if (start && !isBefore(day, start) && !isSameDay(day, start)) {
        onChange(startDate, toDateStr(day));
        setPhase('start');
        setOpen(false);
      } else {
        onChange(toDateStr(day), '');
        setPhase('end');
      }
    }
  }, [phase, start, startDate, today, onChange]);

  const getDayClass = (day: Date): string => {
    if (isBefore(day, today)) return styles.dayDisabled;
    if (start && isSameDay(day, start)) return styles.daySelected;
    if (end && isSameDay(day, end)) return styles.daySelected;

    const rangeEnd = end || (phase === 'end' && start && hoveredDate && isAfter(hoveredDate, start) ? hoveredDate : null);
    if (start && rangeEnd && isAfter(day, start) && isBefore(day, rangeEnd)) {
      return styles.dayInRange;
    }

    return styles.dayDefault;
  };

  const renderMonth = (monthDate: Date, className?: string) => {
    const ms = startOfMonth(monthDate);
    const me = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: ms, end: me });
    const startPad = getDay(ms) === 0 ? 6 : getDay(ms) - 1;

    return (
      <div className={className || styles.month}>
        <div className={styles.weekRow}>
          {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => <span key={d}>{d}</span>)}
        </div>
        <div className={styles.dayGrid}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className={styles.day} />)}
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={`${styles.day} ${getDayClass(day)}`}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDayClick(day); }}
              onMouseEnter={() => setHoveredDate(day)}
            >
              {format(day, 'd')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const displayValue = start && end
    ? `${format(start, 'd MMM', { locale: ro })} — ${format(end, 'd MMM', { locale: ro })}`
    : start
      ? `${format(start, 'd MMM', { locale: ro })} — ...`
      : null;

  const clear = () => {
    onChange('', '');
    setPhase('start');
  };

  const nextMonth = addMonths(currentMonth, 1);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button type="button" className={styles.trigger} onClick={() => setOpen(!open)}>
        <Calendar size={18} className={styles.triggerIcon} />
        {displayValue ? (
          <span className={styles.value}>{displayValue}</span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className={styles.backdrop} onClick={() => setOpen(false)} />

          <div className={styles.dropdown} onMouseDown={(e) => e.preventDefault()}>
            {/* Header with nav arrows — desktop shows both month names, mobile just arrows */}
            <div className={styles.header}>
              <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, -1))} className={styles.navBtn}>
                <ChevronLeft size={18} />
              </button>
              <div className="hidden md:flex gap-8 text-center">
                <span className={styles.monthLabel}>{format(currentMonth, 'LLLL yyyy', { locale: ro })}</span>
                <span className={styles.monthLabel}>{format(nextMonth, 'LLLL yyyy', { locale: ro })}</span>
              </div>
              <span className={`${styles.monthLabel} md:hidden`}>{format(currentMonth, 'LLLL yyyy', { locale: ro })}</span>
              <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className={styles.navBtn}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className={styles.months}>
              {renderMonth(currentMonth)}
              {renderMonth(nextMonth, styles.monthSecond)}
            </div>

            <div className={styles.footer}>
              <button type="button" onClick={clear} className={styles.clearBtn}>Șterge datele</button>
              {start && end && (
                <button type="button" onClick={() => setOpen(false)} className={styles.confirmBtn}>Confirmă</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
