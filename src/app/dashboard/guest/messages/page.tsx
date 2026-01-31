'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

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
        <div className="card text-center py-12">
          <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nu ai conversații active.</p>
          <Link href="/search" className="btn-primary inline-block mt-4">Caută cazare</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Link key={b.id} href={`/dashboard/guest/bookings/${b.id}`} className="block">
              <div className="card hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {b.property.images?.[0] && <img src={b.property.images[0].url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{b.property.title}</h3>
                    <p className="text-sm text-gray-500 truncate">Gazdă: {b.host.name} · {formatDate(b.startDate)} – {formatDate(b.endDate)}</p>
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
