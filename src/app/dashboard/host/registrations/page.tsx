// src/app/dashboard/host/registrations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Copy, Download, Plus, Settings, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface Submission {
  id: string;
  firstName: string;
  lastName: string;
  citizenship: string;
  documentType: string;
  documentNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  submittedAt: string;
  isDuplicate: boolean;
  fileName: string | null;
}

interface Property {
  id: string;
  title: string;
  guestCapacity: number;
  guestFormLink: { token: string; isActive: boolean } | null;
}

export default function RegistrationsPage() {
  const lang = useLang();
  const t = dashboardT[lang].guestForms;

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [capacityValues, setCapacityValues] = useState<Record<string, string>>({});
  const [savingCapacity, setSavingCapacity] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const dateStr = (d: string) =>
    format(new Date(d), 'd MMM yyyy', { locale: lang === 'ro' ? ro : enUS });

  // On mount: load properties list
  useEffect(() => {
    fetch('/api/host/guest-forms')
      .then(r => r.json())
      .then(d => {
        const props: Property[] = (d.properties ?? []).map(
          (p: { id: string; title: string; guestCapacity: number; guestFormLink: Property['guestFormLink'] }) => ({
            id: p.id,
            title: p.title,
            guestCapacity: p.guestCapacity,
            guestFormLink: p.guestFormLink ?? null,
          })
        );
        setProperties(props);
        const caps: Record<string, string> = {};
        props.forEach(p => { caps[p.id] = String(p.guestCapacity); });
        setCapacityValues(caps);
        if (props.length > 0) {
          setPropertyId(props[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch submissions when filters change
  useEffect(() => {
    if (!propertyId) {
      setSubmissions([]);
      setTotal(0);
      setPages(1);
      return;
    }

    setSubLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (month) params.set('month', month);
    if (year) params.set('year', year);

    fetch(`/api/properties/${propertyId}/submissions?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(d.submissions ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .finally(() => setSubLoading(false));
  }, [propertyId, month, year, page]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/host/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success(t.deleted);
      } else {
        toast.error('Error deleting form');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (id: string) => {
    window.location.href = '/api/host/submissions/' + id + '/download';
  };

  const handleBulkDownload = () => {
    if (!propertyId || selectedIds.size === 0) return;
    window.location.href =
      '/api/properties/' +
      propertyId +
      '/submissions/bulk-download?ids=' +
      Array.from(selectedIds).join(',');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCapacityBlur = async (propertyId: string) => {
    const raw = capacityValues[propertyId];
    const value = parseInt(raw, 10);
    const property = properties.find(p => p.id === propertyId);
    if (!property || isNaN(value) || value < 1 || value === property.guestCapacity) return;
    setSavingCapacity(s => ({ ...s, [propertyId]: true }));
    try {
      const res = await fetch(`/api/properties/${propertyId}/capacity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCapacity: value }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, guestCapacity: data.guestCapacity } : p));
      setCapacityValues(c => ({ ...c, [propertyId]: String(data.guestCapacity) }));
      toast.success(t.capacitySaved);
    } finally {
      setSavingCapacity(s => ({ ...s, [propertyId]: false }));
    }
  };

  const handleToggleActive = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property?.guestFormLink) return;
    setTogglingId(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/form-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !property.guestFormLink.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      setProperties(prev =>
        prev.map(p => p.id === propertyId
          ? { ...p, guestFormLink: p.guestFormLink ? { ...p.guestFormLink, isActive: data.link.isActive } : data.link }
          : p
        )
      );
      toast.success(data.link.isActive ? t.activated : t.deactivated);
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set<string>(submissions.map(s => s.id)));
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-14" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.registrationsSubtitle}</p>
        </div>
        <Link
          href="/dashboard/host/registrations/new"
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={16} /> {t.newForm}
        </Link>
      </div>

      {/* Property links panel */}
      {properties.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.linksPanel}</h2>
          <div className="divide-y divide-gray-100">
            {properties.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="text-sm font-medium flex-1 truncate">{p.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.guestFormLink ? (
                      <>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.guestFormLink.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.guestFormLink.isActive ? t.active : t.inactive}
                        </span>
                        {p.guestFormLink.isActive && (
                          <button
                            onClick={() => handleCopyLink(p.guestFormLink!.token, p.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                          >
                            <Copy size={12} />
                            {copiedId === p.id ? t.copied : t.copyLink}
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        >
                          <Settings size={12} /> {t.settingsBtn}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          {t.noLink}
                        </span>
                        <Link
                          href="/dashboard/host/registrations/new"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        >
                          <Plus size={12} /> {t.setupLink}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                {expandedId === p.id && p.guestFormLink && (
                  <div className="pb-3 pt-1 pl-2 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">{t.capacityLabel}</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="input w-20 text-sm py-1"
                        value={capacityValues[p.id] ?? String(p.guestCapacity)}
                        onChange={e => setCapacityValues(c => ({ ...c, [p.id]: e.target.value }))}
                        onBlur={() => handleCapacityBlur(p.id)}
                      />
                      {savingCapacity[p.id] && <span className="text-xs text-gray-400">{t.savingCapacity}</span>}
                    </div>
                    <button
                      onClick={() => handleToggleActive(p.id)}
                      disabled={togglingId === p.id}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      {p.guestFormLink.isActive
                        ? <ToggleRight size={14} className="text-green-500" />
                        : <ToggleLeft size={14} />}
                      {p.guestFormLink.isActive ? t.deactivate : t.activate}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        {/* Property select */}
        {properties.length > 0 && (
          <div>
            <label className="label">{t.filterProperty}</label>
            <select
              className="input"
              value={propertyId}
              onChange={e => {
                setPropertyId(e.target.value);
                setPage(1);
                setSelectedIds(new Set());
              }}
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Month select */}
        <div>
          <label className="label">{t.filterMonth}</label>
          <select
            className="input"
            value={month}
            onChange={e => {
              setMonth(e.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            <option value="">{t.filterAllMonths}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={String(m)}>
                {format(new Date(2024, m - 1, 1), 'MMMM', {
                  locale: lang === 'ro' ? ro : enUS,
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Year select */}
        <div>
          <label className="label">{t.filterYear}</label>
          <select
            className="input"
            value={year}
            onChange={e => {
              setYear(e.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk download — only when items are selected */}
        {selectedIds.size > 0 && propertyId && (
          <button
            onClick={handleBulkDownload}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 transition self-end"
          >
            <Download size={14} /> {t.bulkDownload} ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table / Empty states */}
      {subLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-14" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400">{t.noSubmissions}</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pl-4 pb-3 pt-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === submissions.length && submissions.length > 0
                    }
                    onChange={toggleSelectAll}
                    aria-label={t.selectAll}
                  />
                </th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colGuest}</th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colDocument}</th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colCheckIn}</th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colCheckOut}</th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colSubmitted}</th>
                <th className="pb-3 pt-3 pr-4 font-medium">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <>
                  {s.isDuplicate && (
                    <tr key={s.id + '-dup'} className="bg-yellow-50">
                      <td colSpan={7} className="px-4 py-2">
                        <span className="flex items-center gap-2 text-yellow-700 text-xs">
                          <AlertTriangle size={14} /> {t.duplicateWarning}
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    key={s.id}
                    className={s.isDuplicate ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}
                  >
                    <td className="pl-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {s.lastName} {s.firstName}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {s.documentType} {s.documentNumber}
                    </td>
                    <td className="py-3 pr-4">{dateStr(s.checkInDate)}</td>
                    <td className="py-3 pr-4">{dateStr(s.checkOutDate)}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">
                      {dateStr(s.submittedAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {s.fileName && (
                          <button
                            onClick={() => handleDownload(s.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                          >
                            <Download size={12} /> {t.downloadDocxBtn}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <Trash2 size={12} />{' '}
                          {deletingId === s.id ? t.deleting : t.deleteSubmission}
                        </button>
                      </div>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
