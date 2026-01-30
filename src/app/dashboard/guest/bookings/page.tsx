'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRON, formatDate } from '@/lib/utils';

export default function GuestBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings?role=guest').then(r => r.json()).then(d => {
      setBookings(d.bookings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rezervările mele</h1>
      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nu ai nicio rezervare încă.</p>
          <Link href="/search" className="btn-primary">Caută cazare</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <Link key={b.id} href={`/dashboard/guest/bookings/${b.id}`}>
              <div className="card hover:shadow-md transition flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {b.property.images[0] && <img src={b.property.images[0].url} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{b.property.title}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(b.startDate)} – {formatDate(b.endDate)}</p>
                  <p className="text-sm font-medium text-primary-600 mt-1">{formatRON(b.totalPrice)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
