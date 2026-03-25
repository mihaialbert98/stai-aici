'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDropdown } from '@/hooks/useDropdown';
import { usePagination } from '@/hooks/usePagination';
import { format, startOfDay } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import {
  CalendarDays, TrendingUp, Filter, Plus, ExternalLink, ChevronDown, ChevronUp, Pencil, X, Trash2, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';
import { formatRON } from '@/lib/utils';

type TimeFilter = 'upcoming' | 'past' | 'all' | 'custom';
// 'all' | 'manual' | 'synced' | 'synced:[source]' (e.g. 'synced:airbnb')
type TypeFilter = string;

type Reservation = {
  id: string;
  type: 'platform' | 'manual' | 'synced';
  propertyId: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  revenue: number;
  source: string | null;
  status: string;
  notes: string | null;
  bookingId: string | null;
  blockCalendar?: boolean;
  isBlockManual?: boolean | null;
  color?: string;
};

type EditForm = {
  guestName: string;
  checkIn: string;
  checkOut: string;
  revenue: string;
  source: string;
  notes: string;
};

function hexToRgba(hex: string | undefined | null, alpha: number): string {
  const safe = (hex && /^#[0-9a-f]{6}$/i.test(hex)) ? hex : '#6366f1';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const STATUS_STYLE: Record<string, string> = {
  ACCEPTED: 'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  CANCELLED:'bg-gray-100 text-gray-500',
  REJECTED: 'bg-red-100 text-red-600',
  MANUAL:   'bg-blue-100 text-blue-700',
  SYNCED:   'bg-violet-100 text-violet-700',
  BLOCKED:  'bg-gray-100 text-gray-500',
};

export default function ReservationsPage() {
  const lang = useLang();
  const t = dashboardT[lang].reservations;
  const tm = dashboardT[lang].manualReservation;
  const dateLocale = lang === 'en' ? enUS : ro;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { page, totalPages, total, setPage, setPaginationData, resetPage } = usePagination();
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [platforms, setPlatforms] = useState<{ source: string; color: string }[]>([]);
  const { open: typeOpen, setOpen: setTypeOpen, ref: typeDropdownRef } = useDropdown();

  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [selectedPropId, setSelectedPropId] = useState('');
  const { open: propOpen, setOpen: setPropOpen, ref: propDropdownRef } = useDropdown();

  const [editingManual, setEditingManual] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ guestName: '', checkIn: '', checkOut: '', revenue: '', source: '', notes: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingEdit, setDeletingEdit] = useState(false);

  const [editingSynced, setEditingSynced] = useState<Reservation | null>(null);
  const [editSyncedForm, setEditSyncedForm] = useState({ guestName: '', revenue: '', notes: '', isBlockManual: null as boolean | null });
  const [savingSyncedEdit, setSavingSyncedEdit] = useState(false);
  const [showSyncedBlockWarn, setShowSyncedBlockWarn] = useState(false);

  useEffect(() => {
    fetch('/api/host/properties').then(r => r.json()).then(d => setProperties(d.properties || []));
  }, []);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    const now = startOfDay(new Date());
    if (timeFilter === 'upcoming') {
      params.set('from', now.toISOString());
    } else if (timeFilter === 'past') {
      params.set('to', now.toISOString());
    } else if (timeFilter === 'custom' && customFrom) {
      params.set('from', new Date(customFrom).toISOString());
      if (customTo) params.set('to', new Date(customTo).toISOString());
    }

    if (selectedPropId) params.set('propertyIds', selectedPropId);
    if (typeFilter.startsWith('synced:')) {
      params.set('type', 'synced');
      params.set('source', typeFilter.slice('synced:'.length));
    } else if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    }
    params.set('page', String(page));

    try {
      const data = await fetch(`/api/host/reservations?${params}`).then(r => r.json());
      setReservations(data.reservations || []);
      setTotalRevenue(data.totalRevenue || 0);
      setPaginationData({ total: data.total ?? 0, totalPages: data.totalPages ?? 1, page: data.page ?? page });
      if (data.platforms) setPlatforms(data.platforms);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, typeFilter, selectedPropId, customFrom, customTo, page]);

  useEffect(() => {
    if (timeFilter !== 'custom') fetchReservations();
  }, [timeFilter, typeFilter, selectedPropId, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  }, [timeFilter, typeFilter, selectedPropId, customFrom, customTo]);

  const openEdit = (r: Reservation) => {
    setEditForm({
      guestName: r.guestName === '—' ? '' : r.guestName,
      checkIn: r.checkIn.slice(0, 10),
      checkOut: r.checkOut.slice(0, 10),
      revenue: String(r.revenue),
      source: r.source || '',
      notes: r.notes || '',
    });
    setEditingManual(r);
  };

  const saveEdit = async () => {
    if (!editingManual) return;
    setSavingEdit(true);
    try {
      await fetch(`/api/host/manual-reservations/${editingManual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: editForm.guestName || null,
          checkIn: editForm.checkIn,
          checkOut: editForm.checkOut,
          revenue: parseFloat(editForm.revenue) || 0,
          source: editForm.source || null,
          notes: editForm.notes || null,
          blockCalendar: true,
        }),
      });
      setEditingManual(null);
      fetchReservations();
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteEdit = async () => {
    if (!editingManual || !confirm(tm.deleteConfirm)) return;
    setDeletingEdit(true);
    try {
      await fetch(`/api/host/manual-reservations/${editingManual.id}`, { method: 'DELETE' });
      setEditingManual(null);
      fetchReservations();
    } finally {
      setDeletingEdit(false);
    }
  };

  const openEditSynced = (r: Reservation) => {
    setEditSyncedForm({ guestName: r.guestName === '—' ? '' : r.guestName, revenue: String(r.revenue), notes: r.notes || '', isBlockManual: r.isBlockManual ?? null });
    setEditingSynced(r);
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
      fetchReservations();
    } finally {
      setSavingSyncedEdit(false);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACCEPTED: t.statusAccepted,
      PENDING: t.statusPending,
      CANCELLED: t.statusCancelled,
      REJECTED: t.statusRejected,
      MANUAL: t.statusManual,
      SYNCED:   lang === 'ro' ? 'Sincronizat' : 'Synced',
      BLOCKED:  lang === 'ro' ? 'Blocat' : 'Blocked',
    };
    return map[status] || status;
  };

  const propLabel = selectedPropId
    ? properties.find(p => p.id === selectedPropId)?.title || t.allProperties
    : t.allProperties;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <Link href="/dashboard/host/calendar" className="btn-primary flex items-center gap-2 self-start">
          <Plus size={16} /> {t.addManual}
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-5 relative z-10">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Time filter */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5"><Filter size={11} className="inline mr-1" />{lang === 'ro' ? 'Perioadă' : 'Period'}</p>
            <div className="flex gap-1 flex-wrap">
              {(['upcoming', 'past', 'all', 'custom'] as TimeFilter[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    timeFilter === tf ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tf === 'upcoming' ? t.upcoming : tf === 'past' ? t.past : tf === 'all' ? t.all : t.custom}
                </button>
              ))}
            </div>
          </div>

          {/* Type / platform filter dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <p className="text-xs font-medium text-gray-500 mb-1.5">{lang === 'ro' ? 'Tip' : 'Type'}</p>
            <button
              onClick={() => setTypeOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition min-w-[160px]"
            >
              <span className="flex-1 text-left truncate">
                {typeFilter === 'all'
                  ? (lang === 'ro' ? 'Toate rezervările' : 'All reservations')
                  : typeFilter === 'manual'
                  ? (lang === 'ro' ? 'Rezervări manuale' : 'Manual reservations')
                  : typeFilter === 'synced'
                  ? (lang === 'ro' ? 'Externe (toate)' : 'External (all)')
                  : typeFilter.startsWith('synced:')
                  ? typeFilter.slice('synced:'.length)
                  : typeFilter}
              </span>
              {typeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {typeOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-56">
                {[
                  { value: 'all', label: lang === 'ro' ? 'Toate rezervările' : 'All reservations' },
                  { value: 'manual', label: lang === 'ro' ? 'Rezervări manuale' : 'Manual reservations' },
                  { value: 'synced', label: lang === 'ro' ? 'Externe (toate)' : 'External (all)' },
                  ...platforms.map(p => ({ value: `synced:${p.source}`, label: p.source, color: p.color })),
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setTypeFilter(opt.value); setTypeOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 flex items-center gap-2 ${typeFilter === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                  >
                    {'color' in opt && opt.color && (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property filter */}
          {properties.length > 1 && (
            <div className="relative" ref={propDropdownRef}>
              <p className="text-xs font-medium text-gray-500 mb-1.5">{lang === 'ro' ? 'Proprietate' : 'Property'}</p>
              <button
                onClick={() => setPropOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                <span className="max-w-[140px] truncate">{propLabel}</span>
                {propOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {propOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-56">
                  <button
                    onClick={() => { setSelectedPropId(''); setPropOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 ${!selectedPropId ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                  >
                    {t.allProperties}
                  </button>
                  {properties.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPropId(p.id); setPropOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 truncate ${selectedPropId === p.id ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom date range */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="label">{t.from}</label>
              <input type="date" className="input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">{t.to}</label>
              <input type="date" className="input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
            <button onClick={fetchReservations} disabled={!customFrom} className="btn-primary disabled:opacity-50 h-[42px]">
              {t.apply}
            </button>
          </div>
        )}
      </div>

      {/* Summary strip */}
      {!loading && reservations.length > 0 && (
        <div className="flex gap-6 mb-4 px-1">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays size={15} className="text-gray-400" />
            <span className="font-semibold">{total}</span>
            <span className="text-gray-500">{t.totalBookings}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={15} className="text-gray-400" />
            <span className="font-semibold text-green-600">{formatRON(totalRevenue)}</span>
            <span className="text-gray-500">{t.totalRevenue}</span>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : reservations.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t.noResults}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map(r => (
              <div
                key={r.id}
                className="card flex flex-col sm:flex-row sm:items-center gap-3"
                style={r.type === 'synced' && r.color ? {
                  backgroundColor: hexToRgba(r.color, 0.06),
                  borderLeft: `3px solid ${r.color}`,
                } : undefined}
              >
                {/* Type badge */}
                <div className="flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    r.type === 'platform'
                      ? 'bg-primary-50 text-primary-700'
                      : r.type === 'synced'
                      ? (r.status === 'BLOCKED' ? 'bg-gray-100 text-gray-500' : 'bg-violet-50 text-violet-700')
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {r.type === 'platform'
                      ? t.typePlatform
                      : r.type === 'synced'
                      ? (r.status === 'BLOCKED'
                          ? (lang === 'ro' ? 'Blocat extern' : 'External block')
                          : (lang === 'ro' ? 'Sincronizat' : 'Synced'))
                      : t.typeManual}
                  </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{r.propertyTitle}</span>
                    {r.source && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                        {r.source}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{r.guestName}</span>
                    <span>
                      {format(new Date(r.checkIn), 'd MMM', { locale: dateLocale })}
                      {' – '}
                      {format(new Date(r.checkOut), 'd MMM yyyy', { locale: dateLocale })}
                    </span>
                    <span className="text-gray-400">{t.nights(r.nights)}</span>
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.notes}</p>}
                </div>

                {/* Right side — always same width */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right min-w-[90px]">
                    {r.status !== 'BLOCKED' && (
                      <p className="font-bold text-green-600">{formatRON(r.revenue)}</p>
                    )}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <div className="w-8 flex justify-center">
                    {r.type === 'manual' ? (
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition"
                        title={tm.editEntry}
                      >
                        <Pencil size={15} />
                      </button>
                    ) : r.type === 'synced' ? (
                      <button
                        onClick={() => openEditSynced(r)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition"
                        title={lang === 'ro' ? 'Editează' : 'Edit'}
                      >
                        <Pencil size={15} />
                      </button>
                    ) : r.bookingId ? (
                      <Link
                        href={`/dashboard/host/bookings/${r.bookingId}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition"
                        title={lang === 'ro' ? 'Vezi detalii' : 'View details'}
                      >
                        <ExternalLink size={15} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {lang === 'ro' ? '← Anterior' : '← Prev'}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '…' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {lang === 'ro' ? 'Următor →' : 'Next →'}
          </button>
        </div>
      )}

      {/* Edit synced reservation modal — limited fields, no delete */}
      {editingSynced && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-lg">{lang === 'ro' ? 'Rezervare sincronizată' : 'Synced reservation'}</h2>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{editingSynced.source}</p>
              </div>
              <button onClick={() => setEditingSynced(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {/* Read-only dates */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkIn}</p>
                  <p className="font-medium">{format(new Date(editingSynced.checkIn), 'd MMM yyyy', { locale: dateLocale })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{tm.checkOut}</p>
                  <p className="font-medium">{format(new Date(editingSynced.checkOut), 'd MMM yyyy', { locale: dateLocale })}</p>
                </div>
              </div>
              <div>
                <label className="label">{tm.guestName}</label>
                <input className="input" placeholder={tm.guestNamePlaceholder} value={editSyncedForm.guestName}
                  onChange={e => setEditSyncedForm(f => ({ ...f, guestName: e.target.value }))} />
              </div>
              {editSyncedForm.isBlockManual !== true && (
                <div>
                  <label className="label">{tm.revenue}</label>
                  <input type="number" className="input" min="0" step="0.01" value={editSyncedForm.revenue}
                    onChange={e => setEditSyncedForm(f => ({ ...f, revenue: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="label">{tm.notes}</label>
                <textarea className="input resize-none" rows={2} placeholder={tm.notesPlaceholder} value={editSyncedForm.notes}
                  onChange={e => setEditSyncedForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {/* Block / Reservation toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{lang === 'ro' ? 'Tip eveniment' : 'Event type'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lang === 'ro' ? 'Suprascrie detectarea automată' : 'Override automatic detection'}</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: false }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${editSyncedForm.isBlockManual === false ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}
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
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${editSyncedForm.isBlockManual === true ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {lang === 'ro' ? 'Blocat' : 'Block'}
                  </button>
                  {editSyncedForm.isBlockManual !== null && (
                    <button
                      onClick={() => setEditSyncedForm(f => ({ ...f, isBlockManual: null }))}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
                      title={lang === 'ro' ? 'Resetează la automat' : 'Reset to automatic'}
                    >↺</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {lang === 'ro'
                  ? 'Datele și sursa sunt controlate de calendarul sincronizat.'
                  : 'Dates and source are controlled by the synced calendar.'}
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5 pt-2">
              <button onClick={() => setEditingSynced(null)} className="btn-outline text-sm px-4 py-2">{tm.cancel}</button>
              <button onClick={saveSyncedEdit} disabled={savingSyncedEdit} className="btn-primary text-sm px-4 py-2 disabled:opacity-50 flex items-center gap-2">
                {savingSyncedEdit ? <><Loader2 size={14} className="animate-spin" />{tm.saving}</> : tm.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue removal warning modal */}
      {showSyncedBlockWarn && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-2">
              {lang === 'ro' ? 'Elimini venitul?' : 'Remove revenue?'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {lang === 'ro'
                ? `Dacă marchezi aceste date ca blocate, venitul de ${formatRON(parseFloat(editSyncedForm.revenue))} va fi eliminat și nu va fi inclus în rapoarte.`
                : `Marking this as blocked will remove the revenue of ${formatRON(parseFloat(editSyncedForm.revenue))} and exclude it from reports.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSyncedBlockWarn(false)} className="btn-outline text-sm px-4 py-2">
                {tm.cancel}
              </button>
              <button
                onClick={() => {
                  setEditSyncedForm(f => ({ ...f, isBlockManual: true, revenue: '0' }));
                  setShowSyncedBlockWarn(false);
                }}
                className="btn-primary text-sm px-4 py-2"
              >
                {lang === 'ro' ? 'Confirmă' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit manual reservation modal */}
      {editingManual && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-semibold text-lg">{tm.editEntryTitle}</h2>
              <button onClick={() => setEditingManual(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="label">{tm.guestName}</label>
                <input
                  className="input"
                  placeholder={tm.guestNamePlaceholder}
                  value={editForm.guestName}
                  onChange={e => setEditForm(f => ({ ...f, guestName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{tm.checkIn}</label>
                  <input type="date" className="input" value={editForm.checkIn} onChange={e => setEditForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{tm.checkOut}</label>
                  <input type="date" className="input" value={editForm.checkOut} onChange={e => setEditForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">{tm.revenue}</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  value={editForm.revenue}
                  onChange={e => setEditForm(f => ({ ...f, revenue: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">{tm.source}</label>
                <input
                  className="input"
                  placeholder={tm.sourcePlaceholder}
                  value={editForm.source}
                  onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">{tm.notes}</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder={tm.notesPlaceholder}
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 pb-5 pt-2">
              <button
                onClick={deleteEdit}
                disabled={deletingEdit}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition"
              >
                <Trash2 size={14} /> {tm.deleteEntry}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditingManual(null)} className="btn-outline text-sm px-4 py-2">
                  {tm.cancel}
                </button>
                <button onClick={saveEdit} disabled={savingEdit || !editForm.checkIn || !editForm.checkOut} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                  {savingEdit ? tm.saving : tm.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
