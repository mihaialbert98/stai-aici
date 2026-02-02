'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PropertyCard } from '@/components/PropertyCard';
import { CityPicker } from '@/components/CityPicker';
import { Pagination } from '@/components/Pagination';
import { PropertyGridSkeleton } from '@/components/PropertyCardSkeleton';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface Amenity { id: string; name: string }

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto py-10 px-4">Se încarcă...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // Filters
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/amenities').then(r => r.json()).then(d => setAmenities(d.amenities || []));
    fetch('/api/favorites').then(r => r.json()).then(d => setFavoriteIds(d.favoriteIds || []));
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  const fetchProperties = async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    const res = await fetch(`/api/properties?${params}`);
    const data = await res.json();
    setProperties(data.properties || []);
    setTotal(data.total || 0);
    setTotalPages(data.pages || 1);
    setLoading(false);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (guests) params.set('guests', guests);
    if (selectedAmenities.length) params.set('amenities', selectedAmenities.join(','));
    // Reset to page 1 when filters change
    router.push(`/search?${params.toString()}`);
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const currentPage = Number(searchParams.get('page')) || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set('page', String(newPage));
    else params.delete('page');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {city ? `Cazări în ${city}` : 'Toate cazările'} <span className="text-gray-400 text-lg font-normal">({total})</span>
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              const params = new URLSearchParams(searchParams.toString());
              params.set('sortBy', e.target.value);
              params.delete('page');
              router.push(`/search?${params.toString()}`);
            }}
            className="input py-2 text-sm pr-8"
          >
            <option value="newest">Cele mai noi</option>
            <option value="price_asc">Preț crescător</option>
            <option value="price_desc">Preț descrescător</option>
            <option value="rating">Rating</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filtre
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">Oraș</label>
              <CityPicker value={city} onChange={setCity} placeholder="Alege orașul" />
            </div>
            <div>
              <label className="label">Preț minim (RON)</label>
              <input type="number" className="input" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Preț maxim (RON)</label>
              <input type="number" className="input" placeholder="5000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Oaspeți</label>
              <input type="number" className="input" placeholder="Nr. oaspeți" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Facilități</label>
            <div className="flex flex-wrap gap-2">
              {amenities.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAmenity(a.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${selectedAmenities.includes(a.id) ? 'bg-primary-100 border-primary-400 text-primary-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={applyFilters} className="btn-primary">Aplică filtre</button>
        </div>
      )}

      {loading ? (
        <PropertyGridSkeleton count={8} />
      ) : properties.length === 0 ? (
        <p className="text-gray-500">Nu am găsit cazări pentru criteriile selectate.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              searchParams={{
                checkIn: searchParams.get('checkIn') || undefined,
                checkOut: searchParams.get('checkOut') || undefined,
                guests: searchParams.get('guests') || undefined,
              }}
              isFavorited={favoriteIds.includes(p.id)}
              onToggleFavorite={(id, fav) => setFavoriteIds(prev => fav ? [...prev, id] : prev.filter(x => x !== id))}
            />
          ))}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}
