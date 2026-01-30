'use client';

import { useEffect, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HostCalendarPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState<string>('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then(r => r.json());
      const data = await fetch('/api/properties?limit=100').then(r => r.json());
      const myProps = (data.properties || []).filter((p: any) => p.hostId === me.user?.userId);
      setProperties(myProps);
      if (myProps.length > 0) setSelectedProp(myProps[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedProp) return;
    fetch(`/api/properties/${selectedProp}`).then(r => r.json()).then(d => {
      const dates = (d.property?.blockedDates || []).map((bd: any) => format(new Date(bd.date), 'yyyy-MM-dd'));
      setBlockedDates(dates);
    });
  }, [selectedProp]);

  const toggleDate = async (dateStr: string) => {
    const isBlocked = blockedDates.includes(dateStr);
    await fetch(`/api/properties/${selectedProp}/blocked-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: [dateStr], block: !isBlocked }),
    });
    setBlockedDates(prev => isBlocked ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1; // Monday start

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendar disponibilitate</h1>

      {properties.length === 0 ? (
        <p className="text-gray-500">Nu ai proprietăți.</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="label">Proprietate</label>
            <select className="input max-w-md" value={selectedProp} onChange={e => setSelectedProp(e.target.value)}>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          <div className="card max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
              <h3 className="font-semibold capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ro })}</h3>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => <span key={d}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const blocked = blockedDates.includes(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleDate(dateStr)}
                    className={`aspect-square rounded-lg text-sm flex items-center justify-center transition ${
                      blocked
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : isToday(day)
                          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Blocat</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-100 border border-primary-300" /> Azi</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Click pe o zi pentru a o bloca/debloca.</p>
          </div>
        </>
      )}
    </div>
  );
}
