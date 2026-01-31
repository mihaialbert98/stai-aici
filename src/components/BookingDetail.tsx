'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatBox } from '@/components/ChatBox';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';
import { PropertyGuide } from '@/components/PropertyGuide';
import { Star } from 'lucide-react';

interface Props {
  role: 'guest' | 'host';
}

export function BookingDetail({ role }: Props) {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

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
  const canReview = role === 'guest' && booking.status === 'ACCEPTED' && new Date(booking.endDate) <= new Date() && !booking.review && !reviewDone;

  const refreshBooking = async () => {
    const res = await fetch(`/api/bookings/${id}`);
    setBooking((await res.json()).booking);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await refreshBooking();
  };

  const handleCancel = async () => {
    if (!confirm('Sigur vrei să anulezi rezervarea?')) return;
    await updateStatus('CANCELLED');
  };

  const handleReview = async () => {
    if (reviewRating < 1) { setReviewError('Selectează un rating'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, rating: reviewRating, comment: reviewComment || undefined }),
    });
    const data = await res.json();
    setReviewSubmitting(false);
    if (!res.ok) { setReviewError(data.error); return; }
    setReviewDone(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{role === 'guest' ? 'Detalii rezervare' : 'Rezervare'}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-2">{prop.title}</h2>
        {role === 'guest' && (
          <p className="text-sm text-gray-500 mb-4">{prop.city} · {prop.address}</p>
        )}
        {role === 'host' && (
          <p className="text-sm text-gray-500 mb-4">Oaspete: {booking.guest.name} ({booking.guest.email})</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Check-in</span><p className="font-medium">{formatDate(booking.startDate)}</p></div>
          <div><span className="text-gray-500">Check-out</span><p className="font-medium">{formatDate(booking.endDate)}</p></div>
          <div><span className="text-gray-500">Nopți</span><p className="font-medium">{nights}</p></div>
          <div><span className="text-gray-500">Total</span><p className="font-medium text-primary-600">{formatRON(booking.totalPrice)}</p></div>
        </div>

        {/* Guest: cancel pending */}
        {role === 'guest' && booking.status === 'PENDING' && (
          <button onClick={handleCancel} className="btn-danger mt-4">Anulează rezervarea</button>
        )}

        {/* Host: accept/reject pending */}
        {role === 'host' && booking.status === 'PENDING' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => updateStatus('ACCEPTED')} className="btn-primary">Acceptă</button>
            <button onClick={() => updateStatus('REJECTED')} className="btn-danger">Refuză</button>
          </div>
        )}
      </div>

      {/* Guest Guide – shown after acceptance */}
      {booking.status === 'ACCEPTED' && (
        <PropertyGuide checkInInfo={prop.checkInInfo} houseRules={prop.houseRules} localTips={prop.localTips} />
      )}

      {/* Review section – guest only */}
      {booking.review && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">{role === 'guest' ? 'Recenzia ta' : 'Recenzie oaspete'}</h2>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={18} className={s <= booking.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
            ))}
          </div>
          {booking.review.comment && <p className="text-sm text-gray-700">{booking.review.comment}</p>}
        </div>
      )}

      {reviewDone && (
        <div className="card text-center py-4">
          <Star size={32} className="fill-yellow-400 text-yellow-400 mx-auto mb-2" />
          <p className="font-medium text-green-700">Mulțumim pentru recenzie!</p>
        </div>
      )}

      {canReview && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Lasă o recenzie</h2>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button" onClick={() => setReviewRating(s)} onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}>
                <Star size={28} className={s <= (reviewHover || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <textarea className="input w-full" rows={3} placeholder="Scrie câteva cuvinte despre experiența ta (opțional)" value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
          {reviewError && <p className="text-red-600 text-sm mt-1">{reviewError}</p>}
          <button onClick={handleReview} disabled={reviewSubmitting || reviewRating < 1} className="btn-primary mt-3 disabled:opacity-50">
            {reviewSubmitting ? 'Se trimite...' : 'Trimite recenzia'}
          </button>
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
