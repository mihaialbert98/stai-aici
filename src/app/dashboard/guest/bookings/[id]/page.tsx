'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatBox } from '@/components/ChatBox';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';
import { Info, BookOpen, Compass } from 'lucide-react';

export default function GuestBookingDetailPage() {
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

  const nights = nightsBetween(booking.startDate, booking.endDate);
  const prop = booking.property;

  const handleCancel = async () => {
    if (!confirm('Sigur vrei să anulezi rezervarea?')) return;
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    const res = await fetch(`/api/bookings/${id}`);
    setBooking((await res.json()).booking);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalii rezervare</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-2">{prop.title}</h2>
        <p className="text-sm text-gray-500 mb-4">{prop.city} · {prop.address}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Check-in</span><p className="font-medium">{formatDate(booking.startDate)}</p></div>
          <div><span className="text-gray-500">Check-out</span><p className="font-medium">{formatDate(booking.endDate)}</p></div>
          <div><span className="text-gray-500">Nopți</span><p className="font-medium">{nights}</p></div>
          <div><span className="text-gray-500">Total</span><p className="font-medium text-primary-600">{formatRON(booking.totalPrice)}</p></div>
        </div>

        {booking.status === 'PENDING' && (
          <button onClick={handleCancel} className="btn-danger mt-4">Anulează rezervarea</button>
        )}
      </div>

      {/* Guest Guide – shown after acceptance */}
      {booking.status === 'ACCEPTED' && (prop.checkInInfo || prop.houseRules || prop.localTips) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ghidul oaspetelui</h2>
          {prop.checkInInfo && (
            <div className="card"><h3 className="font-medium flex items-center gap-2 mb-1"><Info size={16} className="text-primary-500" /> Check-in</h3><p className="text-sm text-gray-700 whitespace-pre-line">{prop.checkInInfo}</p></div>
          )}
          {prop.houseRules && (
            <div className="card"><h3 className="font-medium flex items-center gap-2 mb-1"><BookOpen size={16} className="text-primary-500" /> Reguli</h3><p className="text-sm text-gray-700 whitespace-pre-line">{prop.houseRules}</p></div>
          )}
          {prop.localTips && (
            <div className="card"><h3 className="font-medium flex items-center gap-2 mb-1"><Compass size={16} className="text-primary-500" /> Recomandări</h3><p className="text-sm text-gray-700 whitespace-pre-line">{prop.localTips}</p></div>
          )}
        </div>
      )}

      {/* Chat */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Mesaje</h2>
        <ChatBox bookingId={booking.id} currentUserId={user.userId} />
      </div>
    </div>
  );
}
