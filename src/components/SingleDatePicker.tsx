'use client';

import { useState, useRef, useEffect } from 'react';
import {
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function SingleDatePicker({ value, onChange, placeholder = 'Selectează data' }: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selected) return new Date(selected.getFullYear(), selected.getMonth(), 1);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDayClick = (day: Date) => {
    onChange(toDateStr(day));
    setOpen(false);
  };

  const ms = startOfMonth(currentMonth);
  const me = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: ms, end: me });
  const startPad = getDay(ms) === 0 ? 6 : getDay(ms) - 1;

  const displayValue = selected
    ? format(selected, 'd MMMM yyyy', { locale: ro })
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-left text-gray-900 bg-white cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition flex items-center gap-2 text-sm"
      >
        <Calendar size={18} className="text-gray-400 flex-shrink-0" />
        {displayValue ? (
          <span>{displayValue}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-1 rounded hover:bg-gray-100 transition">
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-sm capitalize text-gray-900">
              {format(currentMonth, 'LLLL yyyy', { locale: ro })}
            </span>
            <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-gray-100 transition">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center text-xs text-gray-500 mb-1 select-none">
            {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => <span key={d}>{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="h-9 flex items-center justify-center text-sm" />
            ))}
            {days.map(day => {
              const isSelected = selected && isSameDay(day, selected);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`h-9 flex items-center justify-center text-sm rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
