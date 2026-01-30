'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatBox } from '@/components/ChatBox';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';

export default function HostBookingDetailPage() {
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

  const updateStatus = async (status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/bookings/${id}`);
    setBooking((await res.json()).booking);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rezervare</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">{booking.property.title}</h2>
        <p className="text-sm text-gray-500 mb-4">Oaspete: {booking.guest.name} ({booking.guest.email})</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Check-in</span><p className="font-medium">{formatDate(booking.startDate)}</p></div>
          <div><span className="text-gray-500">Check-out</span><p className="font-medium">{formatDate(booking.endDate)}</p></div>
          <div><span className="text-gray-500">Nopți</span><p className="font-medium">{nightsBetween(booking.startDate, booking.endDate)}</p></div>
          <div><span className="text-gray-500">Total</span><p className="font-medium text-primary-600">{formatRON(booking.totalPrice)}</p></div>
        </div>

        {booking.status === 'PENDING' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => updateStatus('ACCEPTED')} className="btn-primary">Acceptă</button>
            <button onClick={() => updateStatus('REJECTED')} className="btn-danger">Refuză</button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Mesaje</h2>
        <ChatBox bookingId={booking.id} currentUserId={user.userId} />
      </div>
    </div>
  );
}
