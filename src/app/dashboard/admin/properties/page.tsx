'use client';

import { useEffect, useState } from 'react';
import { formatRON } from '@/lib/utils';
import { ActiveBadge } from '@/components/ActiveBadge';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProps = () => {
    fetch('/api/admin/properties').then(r => r.json()).then(d => {
      setProperties(d.properties || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchProps(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchProps();
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Proprietăți</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Titlu</th>
              <th className="pb-3 font-medium">Oraș</th>
              <th className="pb-3 font-medium">Gazdă</th>
              <th className="pb-3 font-medium">Preț/noapte</th>
              <th className="pb-3 font-medium">Rezervări</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id} className="border-b">
                <td className="py-3 font-medium">{p.title}</td>
                <td className="py-3">{p.city}</td>
                <td className="py-3 text-gray-600">{p.host.name}</td>
                <td className="py-3">{formatRON(p.pricePerNight)}</td>
                <td className="py-3">{p._count.bookings}</td>
                <td className="py-3">
                  <ActiveBadge isActive={p.isActive} />
                </td>
                <td className="py-3">
                  <button onClick={() => toggleActive(p.id, p.isActive)} className="text-sm text-primary-600 hover:underline">
                    {p.isActive ? 'Dezactivează' : 'Activează'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
