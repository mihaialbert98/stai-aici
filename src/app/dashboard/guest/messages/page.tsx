'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';

export default function GuestMessagesPage() {
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
      <h1 className="text-2xl font-bold mb-6">Mesaje</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500">Nu ai conversații active.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Link key={b.id} href={`/dashboard/guest/bookings/${b.id}`}>
              <div className="card hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{b.property.title}</h3>
                    <p className="text-sm text-gray-500">Gazdă: {b.host.name}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
