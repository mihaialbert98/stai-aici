'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatBox } from '@/components/ChatBox';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';
import { PropertyGuide } from '@/components/PropertyGuide';
import { Star, User } from 'lucide-react';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface Props {
  role: 'guest' | 'host';
}

export function BookingDetail({ role }: Props) {
  const { id } = useParams();
  const lang = useLang();
  const t = dashboardT[lang].bookingDetail;
  const dateFnsLocale = lang === 'ro' ? ro : enUS;

  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Guest review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  // Host review state
  const [hostReviewRating, setHostReviewRating] = useState(0);
  const [hostReviewHover, setHostReviewHover] = useState(0);
  const [hostReviewComment, setHostReviewComment] = useState('');
  const [hostReviewSubmitting, setHostReviewSubmitting] = useState(false);
  const [hostReviewError, setHostReviewError] = useState('');
  const [hostReviewDone, setHostReviewDone] = useState(false);

  // Guest reputation (past host reviews) — only loaded for host view
  const [guestReviews, setGuestReviews] = useState<any[]>([]);
  const [guestAvgRating, setGuestAvgRating] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/${id}`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([bData, uData]) => {
      setBooking(bData.booking);
      setUser(uData.user);
    });
  }, [id]);

  // Fetch guest's past host reviews when host views booking
  useEffect(() => {
    if (role !== 'host' || !booking) return;
    fetch(`/api/host-reviews?guestId=${booking.guestId}`)
      .then(r => r.json())
      .then(data => {
        if (data.reviews) {
          setGuestReviews(data.reviews);
          setGuestAvgRating(data.average || null);
        }
      });
  }, [role, booking]);

  if (!booking || !user) return <p className="text-gray-500">{t.loading}</p>;

  const nights = nightsBetween(booking.startDate, booking.endDate);
  const prop = booking.property;
  const isAfterCheckout = new Date(booking.endDate) <= new Date();
  const canReview = role === 'guest' && booking.status === 'ACCEPTED' && isAfterCheckout && !booking.review && !reviewDone;
  const canHostReview = role === 'host' && booking.status === 'ACCEPTED' && isAfterCheckout && !booking.hostReview && !hostReviewDone;

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
    if (!confirm(t.cancelConfirm)) return;
    await updateStatus('CANCELLED');
  };

  const handleReview = async () => {
    if (reviewRating < 1) { setReviewError(t.ratingRequired); return; }
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

  const handleHostReview = async () => {
    if (hostReviewRating < 1) { setHostReviewError(t.ratingRequired); return; }
    setHostReviewSubmitting(true);
    setHostReviewError('');
    const res = await fetch('/api/host-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, rating: hostReviewRating, comment: hostReviewComment || undefined }),
    });
    const data = await res.json();
    setHostReviewSubmitting(false);
    if (!res.ok) { setHostReviewError(data.error); return; }
    setHostReviewDone(true);
  };

  const renderStars = (rating: number, size = 18) => (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  const renderReviewForm = (
    label: string,
    placeholder: string,
    rating: number,
    setRating: (n: number) => void,
    hover: number,
    setHover: (n: number) => void,
    comment: string,
    setComment: (s: string) => void,
    error: string,
    submitting: boolean,
    onSubmit: () => void,
  ) => (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">{label}</h2>
      <div className="flex items-center gap-1 mb-3">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
            <Star size={28} className={s <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
          </button>
        ))}
      </div>
      <textarea className="input w-full" rows={3} placeholder={placeholder} value={comment} onChange={e => setComment(e.target.value)} />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <button onClick={onSubmit} disabled={submitting || rating < 1} className="btn-primary mt-3 disabled:opacity-50">
        {submitting ? t.submitting : t.submitReview}
      </button>
    </div>
  );

  const policyLabel = prop.cancellationPolicy === 'STRICT'
    ? t.policyStrict
    : prop.cancellationPolicy === 'MODERATE'
    ? t.policyModerate
    : t.policyFlexible;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{role === 'guest' ? t.titleGuest : t.titleHost}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-2">{prop.title}</h2>
        {role === 'guest' && (
          <p className="text-sm text-gray-500 mb-4">{prop.city} · {prop.address}</p>
        )}
        {role === 'host' && (
          <p className="text-sm text-gray-500 mb-4">{t.guestInfo(booking.guest.name, booking.guest.email)}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Check-in</span><p className="font-medium">{formatDate(booking.startDate)}</p></div>
          <div><span className="text-gray-500">Check-out</span><p className="font-medium">{formatDate(booking.endDate)}</p></div>
          <div><span className="text-gray-500">{t.nights}</span><p className="font-medium">{nights}</p></div>
          <div><span className="text-gray-500">{t.total}</span><p className="font-medium text-primary-600">{formatRON(booking.totalPrice)}</p></div>
        </div>

        {/* Guest: cancel pending or accepted */}
        {role === 'guest' && (booking.status === 'PENDING' || (booking.status === 'ACCEPTED' && !isAfterCheckout)) && (
          <div className="mt-4">
            {booking.status === 'ACCEPTED' && prop.cancellationPolicy && (
              <p className="text-xs text-gray-500 mb-2">
                {t.cancellationPolicy}: {policyLabel}
              </p>
            )}
            <button onClick={handleCancel} className="btn-danger">{t.cancelBooking}</button>
          </div>
        )}

        {/* Host: accept/reject pending */}
        {role === 'host' && booking.status === 'PENDING' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => updateStatus('ACCEPTED')} className="btn-primary">{t.accept}</button>
            <button onClick={() => updateStatus('REJECTED')} className="btn-danger">{t.reject}</button>
          </div>
        )}
      </div>

      {/* Guest reputation — visible only to host */}
      {role === 'host' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <User size={18} /> {t.guestProfile}
          </h2>
          <p className="font-medium">{booking.guest.name}</p>
          {guestReviews.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mt-2 mb-3">
                {renderStars(Math.round(guestAvgRating || 0))}
                <span className="text-sm text-gray-500">
                  {t.guestReviewCount(guestAvgRating?.toFixed(1) ?? '0', guestReviews.length)}
                </span>
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-3">
                {guestReviews.map((r: any) => (
                  <div key={r.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      {renderStars(r.rating, 14)}
                      <span className="text-gray-400 text-xs">
                        {r.host?.name} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateFnsLocale })}
                      </span>
                    </div>
                    {r.comment && <p className="text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-1">{t.noGuestReviews}</p>
          )}
        </div>
      )}

      {/* Guest Guide – shown after acceptance */}
      {booking.status === 'ACCEPTED' && (
        <PropertyGuide checkInInfo={prop.checkInInfo} houseRules={prop.houseRules} localTips={prop.localTips} />
      )}

      {/* Guest review of property — visible to both */}
      {booking.review && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">{role === 'guest' ? t.yourReview : t.guestPropertyReview}</h2>
          {renderStars(booking.review.rating)}
          {booking.review.comment && <p className="text-sm text-gray-700 mt-2">{booking.review.comment}</p>}
        </div>
      )}

      {reviewDone && (
        <div className="card text-center py-4">
          <Star size={32} className="fill-yellow-400 text-yellow-400 mx-auto mb-2" />
          <p className="font-medium text-green-700">{t.thankYouReview}</p>
        </div>
      )}

      {canReview && renderReviewForm(
        t.leaveReview,
        t.reviewPlaceholder,
        reviewRating, setReviewRating,
        reviewHover, setReviewHover,
        reviewComment, setReviewComment,
        reviewError, reviewSubmitting, handleReview,
      )}

      {/* Host review of guest — only visible to host */}
      {role === 'host' && booking.hostReview && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">{t.yourGuestReview}</h2>
          {renderStars(booking.hostReview.rating)}
          {booking.hostReview.comment && <p className="text-sm text-gray-700 mt-2">{booking.hostReview.comment}</p>}
        </div>
      )}

      {hostReviewDone && (
        <div className="card text-center py-4">
          <Star size={32} className="fill-yellow-400 text-yellow-400 mx-auto mb-2" />
          <p className="font-medium text-green-700">{t.thankYouReview}</p>
        </div>
      )}

      {canHostReview && renderReviewForm(
        t.reviewGuest,
        t.guestReviewPlaceholder,
        hostReviewRating, setHostReviewRating,
        hostReviewHover, setHostReviewHover,
        hostReviewComment, setHostReviewComment,
        hostReviewError, hostReviewSubmitting, handleHostReview,
      )}

      {/* Chat */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t.messages}</h2>
        <ChatBox bookingId={booking.id} currentUserId={user.userId} />
      </div>
    </div>
  );
}
