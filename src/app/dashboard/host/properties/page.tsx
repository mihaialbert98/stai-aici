'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRON } from '@/lib/utils';
import { ActiveBadge } from '@/components/ActiveBadge';
import { Plus, Edit, Users, Star, MessageSquare } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Proprietățile mele</h1>
        <Link href="/dashboard/host/properties/new" className="btn-primary flex items-center gap-2 w-fit">
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
            <div key={p.id} className="card flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-40 sm:h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                {p.images?.[0] && <Image src={p.images[0].url} alt={p.title} fill sizes="(max-width: 640px) 100vw, 128px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.city}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  <span className="text-primary-600 font-medium">{formatRON(p.pricePerNight)} / noapte</span>
                  <span className="flex items-center gap-1 text-gray-500"><Users size={14} /> {p.maxGuests}</span>
                  <ActiveBadge isActive={p.isActive} />
                  {p.reviewCount > 0 ? (
                    <Link href={`/dashboard/host/properties/${p.id}/reviews`} className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700">
                      <Star size={14} className="fill-yellow-500 text-yellow-500" /> {p.avgRating} ({p.reviewCount})
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400"><Star size={14} /> Fără recenzii</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 self-start sm:self-center">
                <Link href={`/dashboard/host/properties/${p.id}/edit`} className="btn-secondary flex items-center gap-1 w-fit">
                  <Edit size={14} /> Editează
                </Link>
                {p.reviewCount > 0 && (
                  <Link href={`/dashboard/host/properties/${p.id}/reviews`} className="btn-secondary flex items-center gap-1 w-fit text-xs">
                    <MessageSquare size={14} /> Recenzii
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
