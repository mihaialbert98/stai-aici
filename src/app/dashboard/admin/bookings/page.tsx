'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRON, formatDate } from '@/lib/utils';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bookings').then(r => r.json()).then(d => {
      setBookings(d.bookings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rezervări</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Proprietate</th>
              <th className="pb-3 font-medium">Oaspete</th>
              <th className="pb-3 font-medium">Gazdă</th>
              <th className="pb-3 font-medium">Perioada</th>
              <th className="pb-3 font-medium">Total</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Chat</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-b">
                <td className="py-3 font-medium">{b.property.title}</td>
                <td className="py-3">{b.guest.name}</td>
                <td className="py-3">{b.host.name}</td>
                <td className="py-3 text-gray-600">{formatDate(b.startDate)} – {formatDate(b.endDate)}</td>
                <td className="py-3">{formatRON(b.totalPrice)}</td>
                <td className="py-3"><StatusBadge status={b.status} /></td>
                <td className="py-3">
                  <Link href={`/dashboard/admin/bookings/${b.id}`} className="text-primary-600 hover:underline text-sm">
                    Deschide
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
