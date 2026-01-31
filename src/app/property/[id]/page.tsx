'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatRON, formatDate, nightsBetween } from '@/lib/utils';
import { MapPin, Users, CheckCircle, Star } from 'lucide-react';
import { PropertyGuide } from '@/components/PropertyGuide';
import { DateRangePicker } from '@/components/DateRangePicker';

export default function PropertyPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-8 text-gray-500">Se încarcă...</div>}>
      <PropertyContent />
    </Suspense>
  );
}

function PropertyContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [property, setProperty] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking form — pre-fill from search params
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guestsStr, setGuestsStr] = useState(searchParams.get('guests') || '1');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/properties/${id}`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([propData, userData]) => {
      setProperty(propData.property);
      setUser(userData.user);
      setLoading(false);
    });
  }, [id]);

  const guests = Number(guestsStr) || 0;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const totalPrice = nights > 0 && property ? nights * property.pricePerNight : 0;

  // Check date availability
  const unavailableOverlap = checkIn && checkOut && property ? (() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const blocked = new Set([
      ...property.blockedDates.map((d: any) => new Date(d.date).toISOString().split('T')[0]),
      ...property.bookings.flatMap((b: any) => {
        const dates: string[] = [];
        const s = new Date(b.startDate);
        const e = new Date(b.endDate);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
      }),
    ]);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      if (blocked.has(d.toISOString().split('T')[0])) return true;
    }
    return false;
  })() : false;

  // Suggest alternative dates
  const suggestedDates = unavailableOverlap && property ? (() => {
    const blocked = new Set([
      ...property.blockedDates.map((d: any) => new Date(d.date).toISOString().split('T')[0]),
      ...property.bookings.flatMap((b: any) => {
        const dates: string[] = [];
        const s = new Date(b.startDate);
        const e = new Date(b.endDate);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
      }),
    ]);
    const requestedNights = nights || 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const suggestions: { start: string; end: string }[] = [];
    // Search next 90 days for a free window of the same length
    for (let i = 0; i < 90 && suggestions.length < 2; i++) {
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + i);
      let free = true;
      for (let n = 0; n < requestedNights; n++) {
        const d = new Date(candidate);
        d.setDate(d.getDate() + n);
        if (blocked.has(d.toISOString().split('T')[0])) { free = false; break; }
      }
      if (free) {
        const endD = new Date(candidate);
        endD.setDate(endD.getDate() + requestedNights);
        const startStr = candidate.toISOString().split('T')[0];
        const endStr = endD.toISOString().split('T')[0];
        // Skip if overlaps with already suggested
        if (!suggestions.some(s => s.start === startStr)) {
          suggestions.push({ start: startStr, end: endStr });
        }
      }
    }
    return suggestions;
  })() : [];

  const guestsExceedMax = property && guests > property.maxGuests;

  const handleBooking = async () => {
    setBookingError('');
    if (!user) { router.push('/auth/login'); return; }
    if (nights < 1) { setBookingError('Selectează datele'); return; }
    if (guests < 1) { setBookingError('Selectează numărul de oaspeți'); return; }
    if (guestsExceedMax) { setBookingError(`Maxim ${property.maxGuests} oaspeți`); return; }
    if (unavailableOverlap) { setBookingError('Perioada selectată nu este disponibilă'); return; }

    setSubmitting(true);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: id, startDate: checkIn, endDate: checkOut, guests }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setBookingError(data.error); return; }
    setBookingSuccess(true);
  };

  if (loading) return <div className="max-w-6xl mx-auto p-8 text-gray-500">Se încarcă...</div>;
  if (!property) return <div className="max-w-6xl mx-auto p-8 text-red-500">Proprietatea nu a fost găsită.</div>;

  const reviewAvg = property.reviews?.length > 0
    ? property.reviews.reduce((s: number, r: any) => s + r.rating, 0) / property.reviews.length
    : 0;

  // Gather blocked/booked dates for display
  const unavailableDates = [
    ...property.blockedDates.map((d: any) => new Date(d.date).toISOString().split('T')[0]),
    ...property.bookings.flatMap((b: any) => {
      const dates: string[] = [];
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    }),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Image gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-8">
        {property.images.map((img: any, i: number) => (
          <div key={img.id} className={`${i === 0 ? 'md:row-span-2' : ''} aspect-[4/3] bg-gray-200`}>
            <img src={img.url} alt={property.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin size={14} /> {property.city} · {property.address}
            </div>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users size={14} /> Max {property.maxGuests} oaspeți</span>
              <span className="flex items-center gap-1 font-semibold text-primary-600">{formatRON(property.pricePerNight)} / noapte</span>
              {property.reviews?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {(Math.round(reviewAvg * 10) / 10).toFixed(1)} ({property.reviews.length})
                </span>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Descriere</h2>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Facilități</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((pa: any) => (
                <span key={pa.amenity.id} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                  <CheckCircle size={14} className="text-green-500" /> {pa.amenity.name}
                </span>
              ))}
            </div>
          </div>

          {/* Guest Guide */}
          <PropertyGuide checkInInfo={property.checkInInfo} houseRules={property.houseRules} localTips={property.localTips} />

          {/* Availability note */}
          {unavailableDates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Disponibilitate</h2>
              <p className="text-sm text-gray-500">
                {unavailableDates.length} zile indisponibile. Verifică datele dorite în formularul de rezervare.
              </p>
            </div>
          )}

          {/* Reviews */}
          {property.reviews?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                {(Math.round(reviewAvg * 10) / 10).toFixed(1)} · {property.reviews.length} {property.reviews.length === 1 ? 'recenzie' : 'recenzii'}
              </h2>
              <div className="space-y-4">
                {property.reviews.map((r: any) => (
                  <div key={r.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{r.guest.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking sidebar (sticky) */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <h3 className="text-lg font-semibold mb-4">Rezervă acum</h3>
            {bookingSuccess ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-700">Cerere trimisă!</p>
                <p className="text-sm text-gray-500 mt-1">Gazda va confirma în curând.</p>
                <button onClick={() => router.push('/dashboard/guest/bookings')} className="btn-primary mt-4 w-full">
                  Vezi rezervările
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="label">Perioada</label>
                    <DateRangePicker
                      startDate={checkIn}
                      endDate={checkOut}
                      onChange={(start, end) => { setCheckIn(start); setCheckOut(end); }}
                      placeholder="Selectează perioada"
                      unavailableDates={unavailableDates}
                    />
                  </div>
                  <div>
                    <label className="label block mb-1">Oaspeți</label>
                    <input type="number" className="input h-[42px]" min={1} max={property.maxGuests} value={guestsStr} onChange={(e) => setGuestsStr(e.target.value)} placeholder="1" />
                    <div className="h-5 mt-1">
                      {guestsExceedMax && (
                        <p className="text-red-600 text-xs">Maxim {property.maxGuests} oaspeți.</p>
                      )}
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{formatRON(property.pricePerNight)} × {nights} nopți</span>
                      <span>{formatRON(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary-600">{formatRON(totalPrice)}</span>
                    </div>
                  </div>
                )}

                {unavailableOverlap && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="text-amber-800 font-medium">Perioada selectată nu este disponibilă.</p>
                    {suggestedDates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-amber-700 text-xs">Sugestii disponibile:</p>
                        {suggestedDates.map((s, i) => (
                          <button key={i} type="button" className="block text-primary-600 hover:underline text-xs"
                            onClick={() => { setCheckIn(s.start); setCheckOut(s.end); }}>
                            {s.start} — {s.end}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {bookingError && <p className="text-red-600 text-sm mt-2">{bookingError}</p>}

                <button onClick={handleBooking} disabled={submitting || nights < 1 || guests < 1 || !!guestsExceedMax || unavailableOverlap} className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Se trimite...' : 'Trimite cererea de rezervare'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">Nu se percep plăți online. Gazda va confirma manual.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
