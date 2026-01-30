'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRON, formatDate } from '@/lib/utils';

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    fetch('/api/bookings?role=host').then(r => r.json()).then(d => {
      setBookings(d.bookings || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBookings();
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  const pending = bookings.filter(b => b.status === 'PENDING');
  const others = bookings.filter(b => b.status !== 'PENDING');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rezervări</h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-yellow-700">Cereri în așteptare ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(b => (
              <div key={b.id} className="card border-yellow-200 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.property.title}</h3>
                    <p className="text-sm text-gray-600">Oaspete: {b.guest.name} ({b.guest.email})</p>
                    <p className="text-sm text-gray-500">{formatDate(b.startDate)} – {formatDate(b.endDate)} · {formatRON(b.totalPrice)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(b.id, 'ACCEPTED')} className="btn-primary text-sm !py-1">Acceptă</button>
                    <button onClick={() => updateStatus(b.id, 'REJECTED')} className="btn-danger text-sm !py-1">Refuză</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Toate rezervările</h2>
      <div className="space-y-3">
        {others.map(b => (
          <Link key={b.id} href={`/dashboard/host/bookings/${b.id}`}>
            <div className="card hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{b.property.title}</h3>
                  <p className="text-sm text-gray-500">{b.guest.name} · {formatDate(b.startDate)} – {formatDate(b.endDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary-600">{formatRON(b.totalPrice)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
