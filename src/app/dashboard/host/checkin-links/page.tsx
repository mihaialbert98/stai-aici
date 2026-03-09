'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2, Copy, RefreshCw, Check, ToggleLeft, ToggleRight, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface CheckInLink {
  id: string;
  token: string;
  isActive: boolean;
}

interface PropertyWithLink {
  id: string;
  title: string;
  images: { url: string }[];
  checkInLink: CheckInLink | null;
}

export default function CheckInLinksPage() {
  const [properties, setProperties] = useState<PropertyWithLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/host/checkin-links')
      .then(r => r.json())
      .then(d => setProperties(d.properties || []))
      .finally(() => setLoading(false));
  }, []);

  const ensureLink = async (propertyId: string) => {
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`);
    const data = await res.json();
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p));
  };

  const publicUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/${token}`;

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
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p));
    toast.success('Link regenerat cu succes');
  };

  const toggleActive = async (propertyId: string, link: CheckInLink) => {
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    const data = await res.json();
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, checkInLink: data.link } : p));
    toast.success(data.link.isActive ? 'Link activat' : 'Link dezactivat');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Link-uri check-in</h1>
        <div className="space-y-4">{[1, 2].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
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
          <Link href="/dashboard/host/properties/new" className="btn-primary">Adaugă proprietate</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Link-uri check-in</h1>
        <p className="text-gray-500 text-sm mt-1">
          Trimite oaspeților un ghid complet — coduri de acces, WiFi, instrucțiuni apartament, check-out și altele.
        </p>
      </div>

      <div className="space-y-4">
        {properties.map(property => (
          <div key={property.id} className="card">
            <div className="flex items-center gap-4">
              {property.images[0] ? (
                <img src={property.images[0].url} alt={property.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{property.title}</h3>

                {property.checkInLink ? (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${property.checkInLink.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {property.checkInLink.isActive ? 'Activ' : 'Inactiv'}
                    </span>

                    <button onClick={() => copyLink(property.checkInLink!.token, property.id)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      {copiedId === property.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      Copiază link
                    </button>

                    <a href={publicUrl(property.checkInLink.token)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      <ExternalLink size={14} /> Previzualizare
                    </a>

                    <Link href={`/dashboard/host/checkin-links/${property.id}`} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition">
                      <Pencil size={14} /> Editează ghidul
                    </Link>

                    <button onClick={() => toggleActive(property.id, property.checkInLink!)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      {property.checkInLink.isActive ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                      {property.checkInLink.isActive ? 'Dezactivează' : 'Activează'}
                    </button>

                    <button onClick={() => regenerateLink(property.id)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition">
                      <RefreshCw size={14} /> Regenerează
                    </button>
                  </div>
                ) : (
                  <button onClick={() => ensureLink(property.id)} className="mt-2 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">
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
