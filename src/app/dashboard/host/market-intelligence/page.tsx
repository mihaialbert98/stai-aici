'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';
import {
  ROMANIAN_CITIES,
  AMENITY_KEYS,
  AMENITY_KEY_LIST,
  getOccupancyDefault,
} from '@/lib/market-intelligence';
import type { AmenityKey } from '@/lib/market-intelligence';
import type { AirbnbListing } from '@/lib/airbnb-scraper';
import type { MarketStats } from '@/lib/market-intelligence';
import { Star, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';

function normalizeDiacritics(str: string): string {
  return str
    .toLowerCase()
    .replace(/[țţ]/g, 't')
    .replace(/[șş]/g, 's')
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i');
}

interface SearchResult {
  listings: AirbnbListing[];
  stats: MarketStats;
  cached: boolean;
  cachedAt: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export default function MarketIntelligencePage() {
  const lang = useLang();
  const t = dashboardT[lang].marketIntelligence;

  // Filter state
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityContainerRef = useRef<HTMLDivElement>(null);
  const [guests, setGuests] = useState(2);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [amenities, setAmenities] = useState<AmenityKey[]>([]);

  // Results state
  const [result, setResult] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Revenue estimator state (editable)
  const [days, setDays] = useState(30);
  const [occupancy, setOccupancy] = useState(70);

  const filteredCities = useMemo(() =>
    ROMANIAN_CITIES.filter(c =>
      citySearch === '' || normalizeDiacritics(c.name).includes(normalizeDiacritics(citySearch))
    ),
    [citySearch]
  );

  const cityGroups = useMemo(() => ({
    urban: filteredCities.filter(c => c.type === 'urban'),
    mountain: filteredCities.filter(c => c.type === 'mountain'),
    seaside: filteredCities.filter(c => c.type === 'seaside'),
    other: filteredCities.filter(c => c.type === 'other'),
  }), [filteredCities]);

  const handleCitySelect = useCallback((name: string) => {
    setCity(name);
    setCitySearch('');
    setShowCityDropdown(false);
  }, []);

  const handleCityInputBlur = useCallback(() => {
    // Delay so click on dropdown option registers first
    setTimeout(() => {
      if (!cityContainerRef.current?.matches(':focus-within')) {
        setShowCityDropdown(false);
        setCitySearch('');
      }
    }, 150);
  }, []);

  function toggleAmenity(key: AmenityKey) {
    setAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function handleSearch() {
    if (!city || !checkin || !checkout) return;
    setStatus('loading');
    setResult(null);

    const params = new URLSearchParams({
      city,
      guests: String(guests),
      checkin,
      checkout,
      amenities: amenities.join(','),
    });

    try {
      const res = await fetch(`/api/host/market-intelligence?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Eroare necunoscută');
        setStatus('error');
        return;
      }

      if (data.stats.count === 0) {
        setStatus('empty');
        return;
      }

      setResult(data);
      setStatus('success');

      // Set revenue estimator defaults
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      const diffDays = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / 86400000);
      setDays(diffDays > 0 ? diffDays : 30);
      setOccupancy(getOccupancyDefault(city, checkinDate.getMonth() + 1));
    } catch {
      setErrorMsg(t.networkError);
      setStatus('error');
    }
  }

  const estimatedRevenue = result
    ? Math.round(result.stats.avg * (occupancy / 100) * days)
    : 0;

  return (
    <div className="flex gap-6 h-full">
      {/* Filter Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4 self-start sticky top-4">
        {/* City */}
        <div ref={cityContainerRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">📍 Oraș / Zonă</label>
          <input
            type="text"
            placeholder={showCityDropdown ? t.searchPlaceholder : (city || t.searchPlaceholder)}
            value={showCityDropdown ? citySearch : city}
            onFocus={() => {
              setCitySearch('');
              setShowCityDropdown(true);
            }}
            onChange={e => setCitySearch(e.target.value)}
            onBlur={handleCityInputBlur}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showCityDropdown && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto text-sm">
              {filteredCities.length === 0 && (
                <div className="px-3 py-2 text-gray-400">Niciun rezultat</div>
              )}
              {cityGroups.urban.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">Orașe principale</div>
                  {cityGroups.urban.map(c => (
                    <button key={c.name} type="button" onMouseDown={() => handleCitySelect(c.name)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 ${city === c.name ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
              {cityGroups.mountain.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">Stațiuni montane</div>
                  {cityGroups.mountain.map(c => (
                    <button key={c.name} type="button" onMouseDown={() => handleCitySelect(c.name)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 ${city === c.name ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
              {cityGroups.seaside.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">Litoral</div>
                  {cityGroups.seaside.map(c => (
                    <button key={c.name} type="button" onMouseDown={() => handleCitySelect(c.name)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 ${city === c.name ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
              {cityGroups.other.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">Alte zone turistice</div>
                  {cityGroups.other.map(c => (
                    <button key={c.name} type="button" onMouseDown={() => handleCitySelect(c.name)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 ${city === c.name ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">👥 {t.guests}</label>
          <input
            type="number" min={1} max={16} value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 {t.checkin}</label>
          <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 {t.checkout}</label>
          <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">✓ {t.amenities}</label>
          <div className="flex flex-col gap-1">
            {AMENITY_KEY_LIST.map(key => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(key)}
                  onChange={() => toggleAmenity(key)}
                  className="rounded"
                />
                {AMENITY_KEYS[key]}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!city || !checkin || !checkout || status === 'loading'}
          className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {t.search}
        </button>
      </aside>

      {/* Results Panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Initial state */}
        {status === 'idle' && (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm">
            {t.initialState}
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.loading}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-700 text-sm">{errorMsg}</span>
            <button onClick={handleSearch} className="text-sm text-red-700 underline">{t.retry}</button>
          </div>
        )}

        {/* Empty */}
        {status === 'empty' && (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm text-center px-8">
            {t.emptyState}
          </div>
        )}

        {/* Success */}
        {status === 'success' && result && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{result.stats.avg} RON</div>
                <div className="text-xs text-blue-600 mt-1">{t.avgPerNight}</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{result.stats.median} RON</div>
                <div className="text-xs text-green-600 mt-1">{t.medianPerNight}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{result.stats.min}–{result.stats.max} RON</div>
                <div className="text-xs text-yellow-600 mt-1">{t.range}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{result.stats.count}</div>
                <div className="text-xs text-gray-500 mt-1">{t.listings}</div>
              </div>
            </div>

            {result.cached && (
              <p className="text-xs text-gray-400">
                {t.cachedNote(new Date(result.cachedAt).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB'))}
              </p>
            )}

            {/* Listing list */}
            <div className="flex flex-col gap-2">
              {result.listings.map(listing => (
                <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-3 flex gap-3 items-center">
                  {listing.thumbnail && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      <Image src={listing.thumbnail} alt={listing.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{listing.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      {listing.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {listing.rating.toFixed(1)} ({listing.reviewCount})
                        </span>
                      )}
                      {listing.amenities.length > 0 && (
                        <span>{listing.amenities.map(k => AMENITY_KEYS[k]).join(' · ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-gray-900">{listing.pricePerNight} RON</span>
                    <a href={listing.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                      {t.viewOnAirbnb} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue estimator */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.revenueEstimator}</h3>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.period}</label>
                  <input
                    type="number" min={1} max={365} value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-24 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.occupancy}</label>
                  <input
                    type="number" min={1} max={100} value={occupancy}
                    onChange={e => setOccupancy(Number(e.target.value))}
                    className="w-24 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 bg-green-50 border border-green-100 rounded-md px-4 py-2 text-sm text-green-800">
                  {t.formula(result.stats.avg, occupancy, days, estimatedRevenue)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
