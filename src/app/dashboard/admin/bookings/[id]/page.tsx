'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatBox } from '@/components/ChatBox';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/${id}`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([bData, uData]) => {
      setBooking(bData.booking);
      setUser(uData.user);
    });
  }, [id]);

  if (!booking || !user) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rezervare (Admin)</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">{booking.property.title}</h2>
        <p className="text-sm text-gray-500">Oaspete: {booking.guest.name} · Gazdă: {booking.host.name}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
          <div><span className="text-gray-500">Check-in</span><p className="font-medium">{formatDate(booking.startDate)}</p></div>
          <div><span className="text-gray-500">Check-out</span><p className="font-medium">{formatDate(booking.endDate)}</p></div>
          <div><span className="text-gray-500">Nopți</span><p className="font-medium">{nightsBetween(booking.startDate, booking.endDate)}</p></div>
          <div><span className="text-gray-500">Total</span><p className="font-medium text-primary-600">{formatRON(booking.totalPrice)}</p></div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Chat (poți interveni ca Suport)</h2>
        <ChatBox bookingId={booking.id} currentUserId={user.userId} />
      </div>
    </div>
  );
}
