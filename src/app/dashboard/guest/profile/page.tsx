'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Calendar, MapPin, Home } from 'lucide-react';
import { formatRON, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function GuestProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guest-profile')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;
  if (!data) return <p className="text-red-500">Eroare la încărcare.</p>;

  const renderStars = (rating: number, size = 16) => (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </span>
  );

  const BookingCard = ({ b }: { b: any }) => (
    <Link href={`/dashboard/guest/bookings/${b.id}`} className="card hover:shadow-md transition-shadow flex gap-4">
      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
        {b.property.images?.[0]?.url ? (
          <Image src={b.property.images[0].url} alt={b.property.title} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400"><Home size={24} /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{b.property.title}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin size={11} /> {b.property.city}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(b.startDate)} – {formatDate(b.endDate)}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-medium">{formatRON(b.totalPrice)}</span>
          <StatusBadge status={b.status} />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Guest rating summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Profilul meu de oaspete</h2>
        {data.guestRating !== null ? (
          <div className="flex items-center gap-3">
            {renderStars(Math.round(data.guestRating), 20)}
            <span className="text-lg font-bold">{data.guestRating}</span>
            <span className="text-sm text-gray-500">
              din {data.guestReviewCount} {data.guestReviewCount === 1 ? 'recenzie' : 'recenzii'} de la gazde
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nu ai recenzii de la gazde încă.</p>
        )}

        {/* Host reviews about the guest */}
        {data.hostReviews.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {data.hostReviews.map((r: any) => (
              <div key={r.id} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  {renderStars(r.rating, 14)}
                  <span className="text-gray-400 text-xs">
                    {r.host?.name} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: ro })}
                  </span>
                </div>
                {r.comment && <p className="text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming bookings */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar size={18} /> Rezervări viitoare
        </h2>
        {data.upcomingBookings.length === 0 ? (
          <p className="text-sm text-gray-500">Nu ai rezervări viitoare.</p>
        ) : (
          <div className="space-y-3">
            {data.upcomingBookings.map((b: any) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>

      {/* Past bookings */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar size={18} /> Rezervări anterioare
        </h2>
        {data.pastBookings.length === 0 ? (
          <p className="text-sm text-gray-500">Nu ai rezervări anterioare.</p>
        ) : (
          <div className="space-y-3">
            {data.pastBookings.map((b: any) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>

      {/* Reviews I've left */}
      {data.myReviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Star size={18} /> Recenziile mele
          </h2>
          <div className="space-y-3">
            {data.myReviews.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/property/${r.property.id}`} className="font-medium text-sm hover:text-primary-600">
                    {r.property.title}
                  </Link>
                  {renderStars(r.rating, 14)}
                </div>
                <p className="text-xs text-gray-500">{r.property.city} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: ro })}</p>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
