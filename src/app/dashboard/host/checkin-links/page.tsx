'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2, Copy, RefreshCw, Pencil, Check, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CheckInLink {
  id: string;
  token: string;
  isActive: boolean;
  wifiName: string | null;
  wifiPassword: string | null;
  videoUrl: string | null;
}

interface PropertyWithLink {
  id: string;
  title: string;
  images: { url: string }[];
  checkInLink: CheckInLink | null;
}

interface EditForm {
  wifiName: string;
  wifiPassword: string;
  videoUrl: string;
}

export default function CheckInLinksPage() {
  const [properties, setProperties] = useState<PropertyWithLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ wifiName: '', wifiPassword: '', videoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/host/checkin-links')
      .then(r => r.json())
      .then(d => setProperties(d.properties || []))
      .finally(() => setLoading(false));
  }, []);

  const getLink = async (propertyId: string) => {
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`);
    const data = await res.json();
    return data.link as CheckInLink;
  };

  const ensureLink = async (propertyId: string) => {
    const link = await getLink(propertyId);
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, checkInLink: link } : p)
    );
    return link;
  };

  const publicUrl = (token: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/checkin/${token}`;

  const copyLink = async (token: string, propertyId: string) => {
    await navigator.clipboard.writeText(publicUrl(token));
    setCopiedId(propertyId);
    toast.success('Link copiat!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const regenerateLink = async (propertyId: string) => {
    if (!confirm('Linkul vechi nu va mai funcționa. Ești sigur?')) return;
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`, { method: 'POST' });
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p)
    );
    toast.success('Link regenerat cu succes');
  };

  const toggleActive = async (propertyId: string, link: CheckInLink) => {
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...link, isActive: !link.isActive }),
    });
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p)
    );
    toast.success(data.link.isActive ? 'Link activat' : 'Link dezactivat');
  };

  const startEdit = (propertyId: string, link: CheckInLink) => {
    setEditingId(propertyId);
    setEditForm({
      wifiName: link.wifiName || '',
      wifiPassword: link.wifiPassword || '',
      videoUrl: link.videoUrl || '',
    });
  };

  const saveEdit = async (propertyId: string, link: CheckInLink) => {
    setSaving(true);
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...link, ...editForm }),
    });
    const data = await res.json();
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p)
    );
    setEditingId(null);
    setSaving(false);
    toast.success('Detalii salvate');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Link-uri check-in</h1>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Link-uri check-in</h1>
        <div className="card text-center py-12">
          <Link2 size={40} className="mx-auto mb-3 text-gray-300" />
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
        <h1 className="text-2xl font-bold">Link-uri check-in</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generează link-uri profesionale cu instrucțiuni pentru oaspeții tăi. Trimite-le pe WhatsApp sau prin Airbnb/Booking.
        </p>
      </div>

      <div className="space-y-4">
        {properties.map(property => (
          <div key={property.id} className="card">
            <div className="flex items-start gap-4">
              {/* Property thumbnail */}
              {property.images[0] ? (
                <img
                  src={property.images[0].url}
                  alt={property.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{property.title}</h3>

                {property.checkInLink ? (
                  <div className="mt-2 space-y-3">
                    {/* Link row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          property.checkInLink.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {property.checkInLink.isActive ? 'Activ' : 'Inactiv'}
                      </span>

                      <span className="text-xs text-gray-400 font-mono truncate max-w-xs">
                        /checkin/{property.checkInLink.token.slice(0, 12)}…
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyLink(property.checkInLink!.token, property.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        {copiedId === property.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        Copiază link
                      </button>

                      <a
                        href={publicUrl(property.checkInLink.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <ExternalLink size={14} /> Previzualizare
                      </a>

                      <button
                        onClick={() => startEdit(property.id, property.checkInLink!)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <Pencil size={14} /> Editează
                      </button>

                      <button
                        onClick={() => toggleActive(property.id, property.checkInLink!)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        {property.checkInLink.isActive
                          ? <ToggleRight size={14} className="text-green-500" />
                          : <ToggleLeft size={14} />}
                        {property.checkInLink.isActive ? 'Dezactivează' : 'Activează'}
                      </button>

                      <button
                        onClick={() => regenerateLink(property.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
                      >
                        <RefreshCw size={14} /> Regenerează
                      </button>
                    </div>

                    {/* Edit form */}
                    {editingId === property.id && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label">Nume rețea Wi-Fi</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="ex. Casa Mea 5G"
                              value={editForm.wifiName}
                              onChange={e => setEditForm(f => ({ ...f, wifiName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="label">Parolă Wi-Fi</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="ex. parola1234"
                              value={editForm.wifiPassword}
                              onChange={e => setEditForm(f => ({ ...f, wifiPassword: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Link video (YouTube/Vimeo, opțional)</label>
                          <input
                            type="url"
                            className="input"
                            placeholder="https://youtube.com/watch?v=..."
                            value={editForm.videoUrl}
                            onChange={e => setEditForm(f => ({ ...f, videoUrl: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-secondary"
                          >
                            Anulează
                          </button>
                          <button
                            onClick={() => saveEdit(property.id, property.checkInLink!)}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                          >
                            {saving ? 'Se salvează…' : 'Salvează'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => ensureLink(property.id)}
                    className="mt-2 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    <Link2 size={14} /> Generează link
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
