'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRON } from '@/lib/utils';
import { Plus, Edit, Users } from 'lucide-react';

export default function HostPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use search API filtered for current host (server will apply host filter via properties owned)
    // Actually, we need a host-specific endpoint. For now, fetch all and the host's properties
    // will be shown via the host properties API
    fetch('/api/properties?limit=100').then(r => r.json()).then(async d => {
      // Fetch user to filter
      const me = await fetch('/api/auth/me').then(r => r.json());
      const myProps = (d.properties || []).filter((p: any) => p.hostId === me.user?.userId);
      setProperties(myProps);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proprietățile mele</h1>
        <Link href="/dashboard/host/properties/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Adaugă proprietate
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nu ai nicio proprietate listată.</p>
          <Link href="/dashboard/host/properties/new" className="btn-primary">Adaugă prima proprietate</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(p => (
            <div key={p.id} className="card flex gap-4">
              <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0].url} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.city}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-primary-600 font-medium">{formatRON(p.pricePerNight)} / noapte</span>
                  <span className="flex items-center gap-1 text-gray-500"><Users size={14} /> {p.maxGuests}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.isActive ? 'Activă' : 'Inactivă'}
                  </span>
                </div>
              </div>
              <Link href={`/dashboard/host/properties/${p.id}/edit`} className="btn-secondary self-center flex items-center gap-1">
                <Edit size={14} /> Editează
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
