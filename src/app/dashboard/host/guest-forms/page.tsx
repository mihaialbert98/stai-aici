'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Copy, RefreshCw, Check, Download, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface GuestFormLink {
  id: string;
  token: string;
  isActive: boolean;
}

interface Property {
  id: string;
  title: string;
  images: { url: string }[];
  guestFormLink: GuestFormLink | null;
}

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
  retentionDate: string;
}

export default function GuestFormsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subPages, setSubPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/host/guest-forms')
      .then(r => r.json())
      .then(d => {
        setProperties(d.properties || []);
        if (d.properties?.length > 0) setSelectedPropertyId(d.properties[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setSubLoading(true);
    fetch(`/api/properties/${selectedPropertyId}/submissions?page=${subPage}`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(d.submissions || []);
        setSubTotal(d.total || 0);
        setSubPages(d.pages || 1);
      })
      .finally(() => setSubLoading(false));
  }, [selectedPropertyId, subPage]);

  const publicUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${token}`;

  const copyLink = async (token: string, propertyId: string) => {
    await navigator.clipboard.writeText(publicUrl(token));
    setCopiedId(propertyId);
    toast.success('Link copiat!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ensureLink = async (propertyId: string) => {
    const res = await fetch(`/api/properties/${propertyId}/guest-form-link`);
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, guestFormLink: data.link } : p)
    );
  };

  const regenerateLink = async (propertyId: string) => {
    if (!confirm('Linkul vechi nu va mai funcționa. Ești sigur?')) return;
    const res = await fetch(`/api/properties/${propertyId}/guest-form-link`, { method: 'POST' });
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, guestFormLink: data.link } : p)
    );
    toast.success('Link regenerat');
  };

  const toggleActive = async (propertyId: string, link: GuestFormLink) => {
    const res = await fetch(`/api/properties/${propertyId}/guest-form-link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, guestFormLink: data.link } : p)
    );
    toast.success(data.link.isActive ? 'Link activat' : 'Link dezactivat');
  };

  const exportCSV = (propertyId: string) => {
    window.location.href = `/api/properties/${propertyId}/submissions/export`;
  };

  const dateStr = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: ro });

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Fișe de cazare</h1>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Fișe de cazare</h1>
        <div className="card text-center py-12">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Nu ai nicio proprietate încă.</p>
          <Link href="/dashboard/host/properties/new" className="btn-primary">
            Adaugă proprietate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fișe de cazare</h1>
        <p className="text-gray-500 text-sm mt-1">
          Colectează datele oaspeților digital, conform legislației române. Trimite link-ul înainte de check-in.
        </p>
      </div>

      {/* Property link cards */}
      <div className="space-y-3 mb-8">
        {properties.map(property => (
          <div key={property.id} className="card">
            <div className="flex items-start gap-4">
              {property.images[0] ? (
                <img
                  src={property.images[0].url}
                  alt={property.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{property.title}</h3>

                {property.guestFormLink ? (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        property.guestFormLink.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {property.guestFormLink.isActive ? 'Activ' : 'Inactiv'}
                    </span>

                    <button
                      onClick={() => copyLink(property.guestFormLink!.token, property.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      {copiedId === property.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      Copiază link
                    </button>

                    <a
                      href={publicUrl(property.guestFormLink.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <ExternalLink size={12} /> Previzualizare
                    </a>

                    <button
                      onClick={() => toggleActive(property.id, property.guestFormLink!)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      {property.guestFormLink.isActive
                        ? <ToggleRight size={12} className="text-green-500" />
                        : <ToggleLeft size={12} />}
                      {property.guestFormLink.isActive ? 'Dezactivează' : 'Activează'}
                    </button>

                    <button
                      onClick={() => regenerateLink(property.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
                    >
                      <RefreshCw size={12} /> Regenerează
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => ensureLink(property.id)}
                    className="mt-2 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    <FileText size={14} /> Generează link
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Fișe completate</h2>
            {subTotal > 0 && (
              <span className="text-sm text-gray-400">{subTotal} total</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {properties.length > 1 && (
              <select
                className="input text-sm py-1.5"
                value={selectedPropertyId || ''}
                onChange={e => { setSelectedPropertyId(e.target.value); setSubPage(1); }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
            {selectedPropertyId && subTotal > 0 && (
              <button
                onClick={() => exportCSV(selectedPropertyId)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {subLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-14" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400">Nu există fișe completate pentru această proprietate.</p>
            <p className="text-sm text-gray-400 mt-1">
              Trimite link-ul de mai sus oaspeților tăi înainte de check-in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">Oaspete</th>
                  <th className="pb-2 pr-4 font-medium">Document</th>
                  <th className="pb-2 pr-4 font-medium">Check-in</th>
                  <th className="pb-2 pr-4 font-medium">Check-out</th>
                  <th className="pb-2 pr-4 font-medium">Persoane</th>
                  <th className="pb-2 font-medium">Înregistrat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{s.lastName} {s.firstName}</td>
                    <td className="py-3 pr-4 text-gray-500">{s.documentType} {s.documentNumber}</td>
                    <td className="py-3 pr-4">{dateStr(s.checkInDate)}</td>
                    <td className="py-3 pr-4">{dateStr(s.checkOutDate)}</td>
                    <td className="py-3 pr-4 text-center">{s.numberOfGuests}</td>
                    <td className="py-3 text-gray-400 text-xs">{dateStr(s.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {subPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setSubPage(p => Math.max(1, p - 1))}
                  disabled={subPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                >
                  ←
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-500">
                  {subPage} / {subPages}
                </span>
                <button
                  onClick={() => setSubPage(p => Math.min(subPages, p + 1))}
                  disabled={subPage === subPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
