'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatRON } from '@/lib/utils';
import {
  CalendarDays, Moon, DollarSign, Clock, TrendingUp, Star,
  BarChart3, ChevronLeft, ChevronRight, ChevronDown, Check,
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  addMonths, subMonths, addYears, subYears, format,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { SingleDatePicker } from '@/components/SingleDatePicker';

type Period = 'month' | 'year' | 'custom';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HostDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [customFrom, setCustomFrom] = useState(toDateStr(startOfMonth(new Date())));
  const [customTo, setCustomTo] = useState(toDateStr(endOfMonth(new Date())));
  const [loading, setLoading] = useState(true);

  // Property filter
  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [propDropdownOpen, setPropDropdownOpen] = useState(false);
  const propDropdownRef = useRef<HTMLDivElement>(null);

  // Load host properties
  useEffect(() => {
    fetch('/api/host/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties || []));
  }, []);

  // Close property dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (propDropdownRef.current && !propDropdownRef.current.contains(e.target as Node)) {
        setPropDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDateRange = () => {
    if (period === 'month') {
      return { from: startOfMonth(refDate), to: endOfMonth(refDate) };
    }
    if (period === 'year') {
      return { from: startOfYear(refDate), to: endOfYear(refDate) };
    }
    return { from: new Date(customFrom), to: new Date(customTo) };
  };

  const fetchStats = () => {
    const { from, to } = getDateRange();
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (selectedPropertyIds.size > 0) {
      params.set('propertyIds', Array.from(selectedPropertyIds).join(','));
    }
    if (!stats) setLoading(true);
    fetch(`/api/host/stats?${params}`)
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  };

  // Auto-fetch when period/refDate/selectedProperties change (but NOT for custom — that uses Apply)
  useEffect(() => {
    if (period !== 'custom') {
      fetchStats();
    }
  }, [period, refDate, selectedPropertyIds]);

  // Fetch on mount for custom too
  useEffect(() => {
    if (period === 'custom') {
      fetchStats();
    }
  }, []);

  const navigatePrev = () => {
    if (period === 'month') setRefDate(d => subMonths(d, 1));
    if (period === 'year') setRefDate(d => subYears(d, 1));
  };
  const navigateNext = () => {
    if (period === 'month') setRefDate(d => addMonths(d, 1));
    if (period === 'year') setRefDate(d => addYears(d, 1));
  };

  const getPeriodLabel = () => {
    if (period === 'month') return format(refDate, 'MMMM yyyy', { locale: ro });
    if (period === 'year') return format(refDate, 'yyyy');
    if (customFrom && customTo) {
      return `${format(new Date(customFrom), 'd MMM yyyy', { locale: ro })} – ${format(new Date(customTo), 'd MMM yyyy', { locale: ro })}`;
    }
    return '';
  };

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const propertyLabel = selectedPropertyIds.size === 0
    ? 'Toate proprietățile'
    : selectedPropertyIds.size === 1
      ? properties.find(p => p.id === Array.from(selectedPropertyIds)[0])?.title || '1 proprietate'
      : `${selectedPropertyIds.size} proprietăți`;

  const singlePropertyId = selectedPropertyIds.size === 1 ? Array.from(selectedPropertyIds)[0] : null;

  const cards: { label: string; value: any; icon: any; color: string; bg: string; link?: string }[] = stats ? [
    { label: 'Rezervări', value: stats.totalBookings, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Nopți rezervate', value: stats.totalNights, icon: Moon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Venit', value: formatRON(stats.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rata de ocupare', value: `${stats.occupancyRate}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Rating mediu', value: stats.avgRating != null ? `${stats.avgRating} (${stats.reviewCount})` : '–', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', link: stats.reviewCount > 0 ? (singlePropertyId ? `/dashboard/host/properties/${singlePropertyId}/reviews` : `/dashboard/host/reviews${selectedPropertyIds.size > 0 ? `?propertyIds=${Array.from(selectedPropertyIds).join(',')}` : ''}`) : undefined },
    { label: 'Cereri în așteptare', value: stats.pendingCount, icon: Clock, color: 'text-red-600', bg: 'bg-red-50', link: stats.pendingCount > 0 ? '/dashboard/host/bookings' : undefined },
  ] : [];

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panou principal</h1>
          {stats && (
            <p className="text-sm text-gray-500 mt-1 capitalize flex items-center gap-1">
              <BarChart3 size={14} /> {getPeriodLabel()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation arrows (month/year only) */}
          {period !== 'custom' && (
            <button onClick={navigatePrev} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition">
              <ChevronLeft size={16} />
            </button>
          )}

          {(['month', 'year', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); if (p !== 'custom') setRefDate(new Date()); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'month' ? 'Lună' : p === 'year' ? 'An' : 'Personalizat'}
            </button>
          ))}

          {period !== 'custom' && (
            <button onClick={navigateNext} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Property filter */}
      {properties.length > 1 && (
        <div className="mb-4 relative" ref={propDropdownRef}>
          <button
            onClick={() => setPropDropdownOpen(!propDropdownOpen)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
          >
            {propertyLabel}
            <ChevronDown size={14} className={`transition ${propDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {propDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 w-72">
              <div
                onClick={() => setSelectedPropertyIds(new Set())}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                  selectedPropertyIds.size === 0 ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                Toate proprietățile
                {selectedPropertyIds.size === 0 && <Check size={14} />}
              </div>
              {properties.map(p => {
                const active = selectedPropertyIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProperty(p.id)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      active ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {active && <Check size={14} className="flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom date pickers */}
      {period === 'custom' && (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 sm:flex-none">
              <label className="label">De la</label>
              <SingleDatePicker value={customFrom} onChange={setCustomFrom} placeholder="Data de început" />
            </div>
            <div className="flex-1 sm:flex-none">
              <label className="label">Până la</label>
              <SingleDatePicker value={customTo} onChange={setCustomTo} placeholder="Data de sfârșit" />
            </div>
            <button
              onClick={fetchStats}
              disabled={!customFrom || !customTo}
              className="btn-primary disabled:opacity-50 h-[42px]"
            >
              Aplică
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse min-h-[120px]">
              <div className="bg-gray-200 h-10 w-10 rounded-lg mb-3" />
              <div className="bg-gray-200 h-7 w-20 rounded mb-1" />
              <div className="bg-gray-200 h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map(c => {
            const inner = (
              <>
                <div className={`${c.bg} ${c.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  <c.icon size={20} />
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-sm text-gray-500">{c.label}</p>
              </>
            );
            if (c.link) {
              return (
                <Link key={c.label} href={c.link} className="card min-h-[120px] hover:shadow-md transition-shadow">
                  {inner}
                </Link>
              );
            }
            return <div key={c.label} className="card min-h-[120px]">{inner}</div>;
          })}
        </div>
      )}

      {stats?.pendingCount > 0 && (
        <Link href="/dashboard/host/bookings" className="btn-primary">
          Vezi cererile în așteptare ({stats.pendingCount})
        </Link>
      )}
    </div>
  );
}
