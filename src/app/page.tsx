'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, MapPin, Users } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CityPicker } from '@/components/CityPicker';
import { PropertyCard } from '@/components/PropertyCard';

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/properties?limit=6')
      .then(r => r.json())
      .then(d => setFeatured(d.properties || []))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Descoperă cele mai bune cazări din România</h1>
          <p className="text-lg text-primary-100 mb-8">De la apartamente moderne la cabane tradiționale</p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 md:p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-3">
            <CityPicker value={city} onChange={setCity} placeholder="Alege orașul" />
            <div className="md:col-span-1">
              <DateRangePicker
                startDate={checkIn}
                endDate={checkOut}
                onChange={(start, end) => { setCheckIn(start); setCheckOut(end); }}
                placeholder="Selectează perioada"
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-3 text-gray-400 z-10" size={18} />
              <input type="number" className="input !pl-10" placeholder="Nr. oaspeți" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2">
              <Search size={18} /> Caută
            </button>
          </form>
        </div>
      </section>

      {/* Featured properties */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Cazări recomandate</h2>
          <button
            onClick={() => router.push('/search')}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            Vezi toate →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-gray-200 h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="bg-gray-200 h-4 w-1/3 rounded" />
                    <div className="bg-gray-200 h-5 w-3/4 rounded" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                    <div className="bg-gray-200 h-5 w-1/4 rounded" />
                  </div>
                </div>
              ))
            : featured.map((p) => <PropertyCard key={p.id} property={p} />)
          }
        </div>
      </section>

      {/* Popular cities */}
      <section className="max-w-6xl mx-auto py-16 px-4 border-t border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Destinații populare</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['București', 'Brașov', 'Cluj-Napoca', 'Sibiu', 'Constanța', 'Timișoara', 'Baia Mare', 'Iași'].map((c) => (
            <button
              key={c}
              onClick={() => router.push(`/search?city=${encodeURIComponent(c)}`)}
              className="bg-white rounded-xl p-6 text-center hover:shadow-md transition border border-gray-100"
            >
              <MapPin className="mx-auto mb-2 text-primary-500" size={24} />
              <span className="font-medium">{c}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
