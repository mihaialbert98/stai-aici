# Market Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Prețuri Piață" page to the host dashboard that scrapes Airbnb's internal API and shows average nightly prices + a revenue estimator for any Romanian city.

**Architecture:** `src/lib/market-intelligence.ts` holds the city list, amenity map, stats computation, and occupancy defaults. `src/lib/airbnb-scraper.ts` performs the Airbnb internal API call (spike first to discover the endpoint). The API route `GET /api/host/market-intelligence` validates input, checks a 24h DB cache, calls the scraper, and returns unified JSON. The page is a client component with a left-sidebar filter panel and a results panel.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma + PostgreSQL, Tailwind CSS, Zod, `crypto` (MD5 cache key), `getSession` from `@/lib/auth`.

**Spec:** `docs/superpowers/specs/2026-03-26-market-intelligence-design.md`

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/lib/market-intelligence.ts` | Create | City list, amenity key map, occupancy defaults, stats (avg/median/min/max) |
| `src/lib/airbnb-scraper.ts` | Create | Airbnb internal API spike + caller + response parser |
| `prisma/schema.prisma` | Modify | Add `MarketSearchCache` model |
| `src/app/api/host/market-intelligence/route.ts` | Create | GET handler: auth, Zod validation, cache, scrape, respond |
| `src/lib/i18n.ts` | Modify | Add `marketIntelligence` nav key + page translations (ro + en) |
| `src/app/dashboard/host/layout.tsx` | Modify | Add "Prețuri Piață" nav item before Settings |
| `src/app/dashboard/host/market-intelligence/page.tsx` | Create | Client page: filter sidebar, stats row, listing list, revenue estimator |

---

## Task 1: market-intelligence.ts — city list, amenity map, occupancy defaults, stats

**Files:**
- Create: `src/lib/market-intelligence.ts`
- Test: `src/lib/market-intelligence.test.ts`

- [ ] **Step 1.1: Write the failing tests**

```typescript
// src/lib/market-intelligence.test.ts
import { describe, it, expect } from 'vitest';
import {
  ROMANIAN_CITIES,
  AMENITY_KEYS,
  getOccupancyDefault,
  computeStats,
} from './market-intelligence';

describe('ROMANIAN_CITIES', () => {
  it('contains at least 90 entries', () => {
    expect(ROMANIAN_CITIES.length).toBeGreaterThanOrEqual(90);
  });
  it('has required fields on every entry', () => {
    for (const c of ROMANIAN_CITIES) {
      expect(c.name).toBeTruthy();
      expect(['urban', 'mountain', 'seaside', 'other']).toContain(c.type);
    }
  });
  it('includes Cluj-Napoca and Mamaia', () => {
    const names = ROMANIAN_CITIES.map(c => c.name);
    expect(names).toContain('Cluj-Napoca');
    expect(names).toContain('Mamaia');
  });
});

describe('AMENITY_KEYS', () => {
  it('has exactly 8 entries', () => {
    expect(Object.keys(AMENITY_KEYS)).toHaveLength(8);
  });
  it('includes all required keys', () => {
    const keys = Object.keys(AMENITY_KEYS);
    for (const k of ['parking','pool','wifi','ac','kitchen','pets','washer','balcony']) {
      expect(keys).toContain(k);
    }
  });
});

describe('getOccupancyDefault', () => {
  it('returns 85 for Mamaia in July (seaside high season)', () => {
    expect(getOccupancyDefault('Mamaia', 7)).toBe(85);
  });
  it('returns 40 for Mamaia in January (seaside low season)', () => {
    expect(getOccupancyDefault('Mamaia', 1)).toBe(40);
  });
  it('returns 80 for Sinaia in January (mountain high season)', () => {
    expect(getOccupancyDefault('Sinaia', 1)).toBe(80);
  });
  it('returns 60 for Sinaia in May (mountain low season)', () => {
    expect(getOccupancyDefault('Sinaia', 5)).toBe(60);
  });
  it('returns 70 for Cluj-Napoca in any summer month (urban)', () => {
    expect(getOccupancyDefault('Cluj-Napoca', 6)).toBe(70);
  });
  it('returns 60 for Cluj-Napoca in December (urban low)', () => {
    expect(getOccupancyDefault('Cluj-Napoca', 12)).toBe(60);
  });
  it('returns 65 for Sighișoara in August (other high)', () => {
    expect(getOccupancyDefault('Sighișoara', 8)).toBe(65);
  });
  it('returns 50 for unknown city in any month', () => {
    expect(getOccupancyDefault('Unknown City', 5)).toBe(50);
  });
});

describe('computeStats', () => {
  it('computes avg, median, min, max, count correctly', () => {
    const prices = [100, 200, 300, 400, 500];
    const stats = computeStats(prices);
    expect(stats.avg).toBe(300);
    expect(stats.median).toBe(300);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(500);
    expect(stats.count).toBe(5);
  });
  it('handles even-length array for median', () => {
    const prices = [100, 200, 300, 400];
    expect(computeStats(prices).median).toBe(250);
  });
  it('returns zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats.avg).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.count).toBe(0);
  });
});
```

- [ ] **Step 1.2: Run tests — verify they fail**

```bash
cd /path/to/stai-aici && npx vitest run src/lib/market-intelligence.test.ts 2>&1 | tail -10
```
Expected: `Cannot find module './market-intelligence'` or similar.

- [ ] **Step 1.3: Implement `src/lib/market-intelligence.ts`**

```typescript
export type CityType = 'urban' | 'mountain' | 'seaside' | 'other';

export interface RomanianCity {
  name: string;
  type: CityType;
}

export const ROMANIAN_CITIES: RomanianCity[] = [
  // Orașe principale
  { name: 'București', type: 'urban' },
  { name: 'Cluj-Napoca', type: 'urban' },
  { name: 'Timișoara', type: 'urban' },
  { name: 'Iași', type: 'urban' },
  { name: 'Constanța', type: 'urban' },
  { name: 'Craiova', type: 'urban' },
  { name: 'Brașov', type: 'urban' },
  { name: 'Galați', type: 'urban' },
  { name: 'Ploiești', type: 'urban' },
  { name: 'Oradea', type: 'urban' },
  { name: 'Sibiu', type: 'urban' },
  { name: 'Bacău', type: 'urban' },
  { name: 'Suceava', type: 'urban' },
  { name: 'Piatra Neamț', type: 'urban' },
  { name: 'Târgu Mureș', type: 'urban' },
  { name: 'Baia Mare', type: 'urban' },
  { name: 'Alba Iulia', type: 'urban' },
  { name: 'Deva', type: 'urban' },
  { name: 'Satu Mare', type: 'urban' },
  { name: 'Botoșani', type: 'urban' },
  { name: 'Râmnicu Vâlcea', type: 'urban' },
  { name: 'Buzău', type: 'urban' },
  { name: 'Focșani', type: 'urban' },
  { name: 'Bistrița', type: 'urban' },
  { name: 'Sfântu Gheorghe', type: 'urban' },
  { name: 'Miercurea Ciuc', type: 'urban' },
  { name: 'Turda', type: 'urban' },
  { name: 'Mediaș', type: 'urban' },
  { name: 'Lugoj', type: 'urban' },
  { name: 'Câmpina', type: 'urban' },
  { name: 'Petroșani', type: 'urban' },
  { name: 'Câmpulung', type: 'urban' },
  { name: 'Roman', type: 'urban' },
  { name: 'Zalău', type: 'urban' },
  { name: 'Drobeta-Turnu Severin', type: 'urban' },
  { name: 'Hunedoara', type: 'urban' },
  { name: 'Medgidia', type: 'urban' },
  { name: 'Reșița', type: 'urban' },
  { name: 'Giurgiu', type: 'urban' },
  { name: 'Slobozia', type: 'urban' },
  { name: 'Alexandria', type: 'urban' },
  { name: 'Târgoviște', type: 'urban' },
  { name: 'Onești', type: 'urban' },
  { name: 'Adjud', type: 'urban' },
  { name: 'Mioveni', type: 'urban' },
  { name: 'Arad', type: 'urban' },
  { name: 'Pitești', type: 'urban' },
  { name: 'Brăila', type: 'urban' },
  { name: 'Râmnicu Sărat', type: 'urban' },
  { name: 'Odorheiu Secuiesc', type: 'urban' },
  { name: 'Reghin', type: 'urban' },
  { name: 'Sighetu Marmației', type: 'urban' },
  // Stațiuni montane
  { name: 'Sinaia', type: 'mountain' },
  { name: 'Predeal', type: 'mountain' },
  { name: 'Poiana Brașov', type: 'mountain' },
  { name: 'Bușteni', type: 'mountain' },
  { name: 'Azuga', type: 'mountain' },
  { name: 'Vatra Dornei', type: 'mountain' },
  { name: 'Sovata', type: 'mountain' },
  { name: 'Băile Herculane', type: 'mountain' },
  { name: 'Băile Felix', type: 'mountain' },
  { name: 'Băile Tușnad', type: 'mountain' },
  { name: 'Covasna', type: 'mountain' },
  { name: 'Bran', type: 'mountain' },
  { name: 'Moeciu', type: 'mountain' },
  { name: 'Fundata', type: 'mountain' },
  { name: 'Rânca', type: 'mountain' },
  { name: 'Straja', type: 'mountain' },
  { name: 'Păltiniș', type: 'mountain' },
  { name: 'Semenic', type: 'mountain' },
  { name: 'Râșnov', type: 'mountain' },
  { name: 'Zărnești', type: 'mountain' },
  { name: 'Borșa', type: 'mountain' },
  { name: 'Arieșeni', type: 'mountain' },
  // Litoral
  { name: 'Mamaia', type: 'seaside' },
  { name: 'Eforie Nord', type: 'seaside' },
  { name: 'Eforie Sud', type: 'seaside' },
  { name: 'Neptun', type: 'seaside' },
  { name: 'Olimp', type: 'seaside' },
  { name: 'Jupiter', type: 'seaside' },
  { name: 'Venus', type: 'seaside' },
  { name: 'Saturn', type: 'seaside' },
  { name: 'Mangalia', type: 'seaside' },
  { name: 'Năvodari', type: 'seaside' },
  { name: 'Techirghiol', type: 'seaside' },
  { name: 'Costinești', type: 'seaside' },
  { name: '2 Mai', type: 'seaside' },
  { name: 'Vama Veche', type: 'seaside' },
  // Alte zone turistice
  { name: 'Sighișoara', type: 'other' },
  { name: 'Sulina', type: 'other' },
  { name: 'Tulcea', type: 'other' },
  { name: 'Cheile Bicazului', type: 'other' },
  { name: 'Murighiol', type: 'other' },
  { name: 'Crișan', type: 'other' },
  { name: 'Mila 23', type: 'other' },
  { name: 'Lacul Roșu', type: 'other' },
  { name: 'Cheile Nerei', type: 'other' },
  { name: 'Certeze', type: 'other' },
  { name: 'Harghita-Băi', type: 'other' },
  { name: 'Peștera', type: 'other' },
  { name: 'Moieciu de Sus', type: 'other' },
  { name: 'Delta Dunării', type: 'other' },
];

export const CITY_NAMES = new Set(ROMANIAN_CITIES.map(c => c.name));

export const AMENITY_KEYS = {
  parking: 'Parcare',
  pool: 'Piscină',
  wifi: 'WiFi',
  ac: 'Aer condiționat',
  kitchen: 'Bucătărie',
  pets: 'Animale de companie acceptate',
  washer: 'Mașină de spălat / uscător',
  balcony: 'Balcon / terasă',
} as const;

export type AmenityKey = keyof typeof AMENITY_KEYS;
export const AMENITY_KEY_LIST = Object.keys(AMENITY_KEYS) as AmenityKey[];

/** Returns occupancy % default for a city and check-in month (1=Jan, 12=Dec). */
export function getOccupancyDefault(city: string, checkinMonth: number): number {
  const cityEntry = ROMANIAN_CITIES.find(c => c.name === city);
  const type = cityEntry?.type ?? 'other';

  if (type === 'seaside') {
    return [6, 7, 8].includes(checkinMonth) ? 85 : 40;
  }
  if (type === 'mountain') {
    return [12, 1, 2].includes(checkinMonth) ? 80 : 60;
  }
  if (type === 'urban') {
    return [11, 12, 1, 2, 3].includes(checkinMonth) ? 60 : 70;
  }
  // other
  return [6, 7, 8].includes(checkinMonth) ? 65 : 50;
}

export interface MarketStats {
  avg: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

export function computeStats(prices: number[]): MarketStats {
  if (prices.length === 0) return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
  return { avg, median, min: sorted[0], max: sorted[sorted.length - 1], count: prices.length };
}
```

- [ ] **Step 1.4: Run tests — verify they pass**

```bash
npx vitest run src/lib/market-intelligence.test.ts 2>&1 | tail -10
```
Expected: all tests PASS.

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/market-intelligence.ts src/lib/market-intelligence.test.ts
git commit -m "feat: add market-intelligence lib — cities, amenities, occupancy defaults, stats"
```

---

## Task 2: Database — MarketSearchCache model + migration

**Files:**
- Modify: `prisma/schema.prisma`
- New migration in `prisma/migrations/`

- [ ] **Step 2.1: Add model to schema**

Open `prisma/schema.prisma` and append this model at the end of the file:

```prisma
model MarketSearchCache {
  id        String   @id @default(cuid())
  cacheKey  String   @unique
  results   Json
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

- [ ] **Step 2.2: Create and run the migration**

```bash
npm run db:migrate
```
When prompted for a migration name, enter: `add_market_search_cache`

Expected: `✓ Generated Prisma Client` with no errors.

- [ ] **Step 2.3: Verify the table was created**

```bash
npx prisma studio
```
Check that `MarketSearchCache` table appears with the correct columns. Then close Studio.

- [ ] **Step 2.4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add MarketSearchCache DB model for market intelligence caching"
```

---

## Task 3: Airbnb scraper spike + implementation

**Files:**
- Create: `src/lib/airbnb-scraper.ts`
- Test: `src/lib/airbnb-scraper.test.ts`

**IMPORTANT — Spike first (do this before writing code):**

Before implementing, open `airbnb.com` in a browser:
1. Open DevTools → Network tab → filter by XHR/Fetch
2. Search for "Cluj-Napoca" with 2 guests, next week's dates
3. Look for a request to `/api/v3/StaysSearch` or similar GraphQL endpoint
4. If found: note the URL, `X-Airbnb-API-Key` header value, `User-Agent`, and request body structure
5. If Airbnb blocks or returns 403: the fallback is to scrape the HTML search results page

The scraper must expose this interface regardless of implementation path:

```typescript
export interface AirbnbListing {
  id: string;
  title: string;
  type: string;
  pricePerNight: number;   // in RON (or closest available currency)
  rating: number | null;
  reviewCount: number;
  amenities: AmenityKey[]; // mapped from Airbnb's internal codes
  thumbnail: string;
  url: string;
}

export async function searchAirbnb(params: {
  city: string;
  guests: number;
  checkin: string;   // ISO date e.g. "2026-07-01"
  checkout: string;
  amenities: AmenityKey[];
}): Promise<AirbnbListing[]>
```

- [ ] **Step 3.1: Write the failing tests (mock-based)**

```typescript
// src/lib/airbnb-scraper.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAirbnb } from './airbnb-scraper';

describe('searchAirbnb', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an array', async () => {
    // Mock global fetch to return a minimal valid response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { presentation: { staysSearch: { results: { searchResults: [] } } } } }),
      text: async () => '[]',
    }));

    const results = await searchAirbnb({
      city: 'Cluj-Napoca',
      guests: 2,
      checkin: '2026-07-01',
      checkout: '2026-07-07',
      amenities: [],
    });
    expect(Array.isArray(results)).toBe(true);
  });

  it('returns AirbnbListing objects with required fields', async () => {
    const mockListing = {
      listing: {
        id: 'abc123',
        name: 'Test Apartment',
        roomTypeCategory: 'entire_home',
        avgRatingA11yLabel: '4.8',
        reviewsCount: 42,
        contextualPictures: [{ picture: 'https://img.example.com/photo.jpg' }],
        listingAmenities: [],
      },
      pricingQuote: {
        structuredStayDisplayPrice: {
          primaryLine: { price: '245 RON' },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          presentation: {
            staysSearch: {
              results: { searchResults: [mockListing] },
            },
          },
        },
      }),
      text: async () => '',
    }));

    const results = await searchAirbnb({
      city: 'Cluj-Napoca',
      guests: 2,
      checkin: '2026-07-01',
      checkout: '2026-07-07',
      amenities: [],
    });

    expect(results).toHaveLength(1); // ensures parser actually extracted the listing
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('pricePerNight');
    expect(results[0]).toHaveProperty('amenities');
    expect(Array.isArray(results[0].amenities)).toBe(true);
  });

  it('returns empty array when fetch fails with 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () => '',
    }));

    await expect(
      searchAirbnb({ city: 'Mamaia', guests: 2, checkin: '2026-07-01', checkout: '2026-07-07', amenities: [] })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 3.2: Run tests — verify they fail**

```bash
npx vitest run src/lib/airbnb-scraper.test.ts 2>&1 | tail -10
```
Expected: `Cannot find module './airbnb-scraper'`.

- [ ] **Step 3.3: Implement `src/lib/airbnb-scraper.ts`**

Implement based on the spike findings. Below is the GraphQL path (adapt if the spike reveals a different shape):

```typescript
import type { AmenityKey } from './market-intelligence';

export interface AirbnbListing {
  id: string;
  title: string;
  type: string;
  pricePerNight: number;
  rating: number | null;
  reviewCount: number;
  amenities: AmenityKey[];
  thumbnail: string;
  url: string;
}

// Airbnb internal amenity IDs → our canonical keys
// Discover the actual IDs during the spike by inspecting the API response.
// Common known IDs (may vary by region):
const AIRBNB_AMENITY_MAP: Record<string, AmenityKey> = {
  '9': 'parking',     // Free parking on premises
  '7': 'pool',        // Pool
  '4': 'wifi',        // Wifi
  '5': 'ac',          // Air conditioning
  '8': 'kitchen',     // Kitchen
  '12': 'pets',       // Pets allowed
  '33': 'washer',     // Washer
  '31': 'balcony',    // Patio or balcony
};

// Airbnb's internal amenity filter codes for query params
const AMENITY_FILTER_IDS: Record<AmenityKey, string> = {
  parking: '9',
  pool: '7',
  wifi: '4',
  ac: '5',
  kitchen: '8',
  pets: '12',
  washer: '33',
  balcony: '31',
};

function parsePrice(priceStr: string): number {
  const match = priceStr.match(/[\d.,]+/);
  if (!match) return 0;
  return Math.round(parseFloat(match[0].replace(',', '.')));
}

function mapAmenities(airbnbAmenities: Array<{ id?: number | string }>): AmenityKey[] {
  const result: AmenityKey[] = [];
  for (const a of airbnbAmenities) {
    const key = AIRBNB_AMENITY_MAP[String(a.id)];
    if (key) result.push(key);
  }
  return result;
}

export async function searchAirbnb(params: {
  city: string;
  guests: number;
  checkin: string;
  checkout: string;
  amenities: AmenityKey[];
}): Promise<AirbnbListing[]> {
  const { city, guests, checkin, checkout, amenities } = params;

  // Build amenity filter array for Airbnb query
  const amenityFilters = amenities.map(k => ({ field: 'amenities', value: AMENITY_FILTER_IDS[k] }));

  const apiKey = 'd306zoyjsyarp7ifhu67rjxn52tv0t20'; // Airbnb's public API key (found in browser requests)

  const variables = {
    request: {
      metaData: { currencyCode: 'RON', itemsPerGrid: 50 },
      rawParams: [
        { filterName: 'query', filterValues: [city] },
        { filterName: 'checkin', filterValues: [checkin] },
        { filterName: 'checkout', filterValues: [checkout] },
        { filterName: 'adults', filterValues: [String(guests)] },
        ...amenityFilters,
      ],
    },
  };

  const url = `https://www.airbnb.com/api/v3/StaysSearch?operationName=StaysSearch&locale=ro&currency=RON`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Airbnb-API-Key': apiKey,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.airbnb.com/',
    },
    body: JSON.stringify({ operationName: 'StaysSearch', variables, extensions: {} }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Airbnb API returned ${response.status}`);
  }

  const json = await response.json();

  // Navigate the response — adapt path based on actual spike findings
  const searchResults =
    json?.data?.presentation?.staysSearch?.results?.searchResults ?? [];

  const listings: AirbnbListing[] = [];
  for (const result of searchResults) {
    const listing = result?.listing;
    const pricing = result?.pricingQuote?.structuredStayDisplayPrice?.primaryLine;
    if (!listing || !pricing) continue;

    const priceStr = pricing?.price ?? pricing?.qualifier ?? '';
    const price = parsePrice(priceStr);
    if (!price) continue;

    listings.push({
      id: String(listing.id),
      title: listing.name ?? '',
      type: listing.roomTypeCategory ?? '',
      pricePerNight: price,
      rating: listing.avgRatingA11yLabel ? parseFloat(listing.avgRatingA11yLabel) : null,
      reviewCount: listing.reviewsCount ?? 0,
      amenities: mapAmenities(listing.listingAmenities ?? []),
      thumbnail: listing.contextualPictures?.[0]?.picture ?? '',
      url: `https://www.airbnb.com/rooms/${listing.id}`,
    });

    if (listings.length >= 200) break;
  }

  return listings;
}
```

**Note:** The exact API key, endpoint path, and response shape must be verified during the spike. If the GraphQL endpoint returns 403, implement HTML scraping of `https://www.airbnb.com/s/{city}/homes?checkin=...&checkout=...&adults=...` using `fetch` + basic string parsing of the `__AIRBNB_DATA__` JSON blob embedded in the HTML.

- [ ] **Step 3.4: Run tests**

```bash
npx vitest run src/lib/airbnb-scraper.test.ts 2>&1 | tail -15
```
Expected: all tests PASS (the mock-based tests should pass regardless of the actual Airbnb response shape).

- [ ] **Step 3.5: Smoke test against real Airbnb (manual)**

Run a quick script to verify the actual endpoint works (requires `tsx` which is available via `npx`):

```bash
npx tsx -e "
import { searchAirbnb } from './src/lib/airbnb-scraper.js';
searchAirbnb({ city: 'Cluj-Napoca', guests: 2, checkin: '2026-07-01', checkout: '2026-07-07', amenities: [] })
  .then(r => console.log('Results:', r.length, 'First price:', r[0]?.pricePerNight))
  .catch(e => console.error('Error:', e.message));
" 2>&1
```

If this fails (module resolution error), alternatively start the dev server and call the API route directly:

```bash
curl "http://localhost:3000/api/host/market-intelligence?city=Cluj-Napoca&guests=2&checkin=2026-07-01&checkout=2026-07-07&amenities=" \
  -H "Cookie: nestly-token=<your-dev-token>" | jq '.stats'
```

If results are 0 or parsing errors occur, adjust the endpoint URL, headers, and response path in `airbnb-scraper.ts` based on what the DevTools spike revealed.

- [ ] **Step 3.6: Commit**

```bash
git add src/lib/airbnb-scraper.ts src/lib/airbnb-scraper.test.ts
git commit -m "feat: add Airbnb internal API scraper"
```

---

## Task 4: API route — GET /api/host/market-intelligence

**Files:**
- Create: `src/app/api/host/market-intelligence/route.ts`
- Test: `src/app/api/host/market-intelligence/route.test.ts`

- [ ] **Step 4.1: Write failing tests**

```typescript
// src/app/api/host/market-intelligence/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    marketSearchCache: {
      deleteMany: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));
vi.mock('@/lib/airbnb-scraper', () => ({
  searchAirbnb: vi.fn().mockResolvedValue([]),
}));

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockSession = { userId: 'user1', role: 'HOST', email: 'host@test.com' };

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/host/market-intelligence');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

const validParams = {
  city: 'Cluj-Napoca',
  guests: '2',
  checkin: '2026-07-01',
  checkout: '2026-07-07',
  amenities: '',
};

describe('GET /api/host/market-intelligence', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
  });

  it('returns 403 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid city', async () => {
    const res = await GET(makeRequest({ ...validParams, city: 'InvalidCity' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when guests out of range', async () => {
    const res = await GET(makeRequest({ ...validParams, guests: '99' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when checkin is after checkout', async () => {
    const res = await GET(makeRequest({ ...validParams, checkin: '2026-07-10', checkout: '2026-07-07' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with listings and stats on success', async () => {
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('listings');
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('avg');
    expect(body.stats).toHaveProperty('count');
  });

  it('returns cached result when cache hit exists', async () => {
    const cachedData = {
      listings: [],
      stats: { avg: 200, median: 200, min: 200, max: 200, count: 1 },
      cached: false,
      cachedAt: new Date().toISOString(),
    };
    vi.mocked(prisma.marketSearchCache.findUnique).mockResolvedValue({
      id: 'c1',
      cacheKey: 'key',
      results: cachedData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    } as any);

    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cached).toBe(true);
  });
});
```

- [ ] **Step 4.2: Run tests — verify they fail**

```bash
npx vitest run src/app/api/host/market-intelligence/route.test.ts 2>&1 | tail -10
```
Expected: module not found errors.

- [ ] **Step 4.3: Implement the route**

Create `src/app/api/host/market-intelligence/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchAirbnb } from '@/lib/airbnb-scraper';
import { computeStats, CITY_NAMES, AMENITY_KEY_LIST } from '@/lib/market-intelligence';
import type { AmenityKey } from '@/lib/market-intelligence';

export const dynamic = 'force-dynamic';

const schema = z.object({
  city: z.string().refine(c => CITY_NAMES.has(c), { message: 'Oraș necunoscut' }),
  guests: z.coerce.number().int().min(1).max(16),
  checkin: z.string().date(),
  checkout: z.string().date(),
  amenities: z.string().optional().transform(v =>
    v ? v.split(',').filter(k => AMENITY_KEY_LIST.includes(k as AmenityKey)) as AmenityKey[] : []
  ),
}).refine(d => d.checkin < d.checkout, { message: 'Check-out trebuie să fie după check-in' });

function cacheKey(params: { city: string; guests: number; checkin: string; checkout: string; amenities: AmenityKey[] }) {
  const normalized = { ...params, amenities: [...params.amenities].sort() };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'HOST' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = schema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametri invalizi', details: parsed.error.issues }, { status: 400 });
  }

  const { city, guests, checkin, checkout, amenities } = parsed.data;
  const key = cacheKey({ city, guests, checkin, checkout, amenities });

  // Delete stale entries
  await prisma.marketSearchCache.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  // Check cache
  const cached = await prisma.marketSearchCache.findUnique({ where: { cacheKey: key } });
  if (cached) {
    const results = cached.results as Record<string, unknown>;
    return NextResponse.json({ ...results, cached: true, cachedAt: cached.createdAt.toISOString() });
  }

  // Scrape Airbnb
  let listings;
  try {
    listings = await searchAirbnb({ city, guests, checkin, checkout, amenities });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('403') || msg.includes('429')) {
      return NextResponse.json({ error: 'Serviciul de date nu este disponibil momentan. Încearcă din nou mai târziu.' }, { status: 502 });
    }
    if (msg.includes('timeout') || msg.toLowerCase().includes('abort')) {
      return NextResponse.json({ error: 'Timeout. Încearcă din nou.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Eroare la procesarea datelor. Încearcă din nou.' }, { status: 502 });
  }

  const stats = computeStats(listings.map(l => l.pricePerNight));
  const now = new Date().toISOString();
  const response = { listings, stats, cached: false, cachedAt: now };

  // Only cache non-empty results
  if (stats.count > 0) {
    await prisma.marketSearchCache.create({
      data: {
        cacheKey: key,
        results: response,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json(response);
}
```

- [ ] **Step 4.4: Run tests — verify they pass**

```bash
npx vitest run src/app/api/host/market-intelligence/route.test.ts 2>&1 | tail -15
```
Expected: all tests PASS.

- [ ] **Step 4.5: Commit**

```bash
git add src/app/api/host/market-intelligence/route.ts \
        src/app/api/host/market-intelligence/route.test.ts
git commit -m "feat: add GET /api/host/market-intelligence route with caching"
```

---

## Task 5: i18n + nav item

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/dashboard/host/layout.tsx`

- [ ] **Step 5.1: Add translation keys to i18n.ts**

In `src/lib/i18n.ts`, find the `ro.nav` object (around line 24–29) and add `marketIntelligence`:

```typescript
// In ro.nav:
marketIntelligence: 'Prețuri Piață',

// In en.nav (around line 435):
marketIntelligence: 'Market Prices',
```

Also add a minimal page title translation:

```typescript
// In ro (after the tasks section):
marketIntelligence: {
  title: 'Prețuri Piață',
  searchPlaceholder: 'Caută oraș...',
  guests: 'Oaspeți',
  checkin: 'Check-in',
  checkout: 'Check-out',
  amenities: 'Facilități',
  search: 'Caută',
  avgPerNight: 'Preț mediu/noapte',
  medianPerNight: 'Preț median/noapte',
  range: 'Interval',
  listings: 'Locuințe găsite',
  revenueEstimator: 'Estimare venit',
  period: 'Perioadă (zile)',
  occupancy: 'Rată ocupare (%)',
  formula: (avg: number, occ: number, days: number, total: number) =>
    `${avg} RON × ${occ}% × ${days} zile = ${total} RON/lună`,
  initialState: 'Selectează un oraș și o perioadă pentru a vedea prețurile din piață.',
  emptyState: 'Nu am găsit locuințe disponibile pentru filtrele selectate. Încearcă să modifici datele sau facilitățile.',
  retry: 'Încearcă din nou',
  viewOnAirbnb: 'Vezi pe Airbnb',
  cachedNote: (date: string) => `Date din cache — actualizate la ${date}`,
},

// In en (equivalent section):
marketIntelligence: {
  title: 'Market Prices',
  searchPlaceholder: 'Search city...',
  guests: 'Guests',
  checkin: 'Check-in',
  checkout: 'Check-out',
  amenities: 'Amenities',
  search: 'Search',
  avgPerNight: 'Avg price/night',
  medianPerNight: 'Median price/night',
  range: 'Range',
  listings: 'Listings found',
  revenueEstimator: 'Revenue estimator',
  period: 'Period (days)',
  occupancy: 'Occupancy (%)',
  formula: (avg: number, occ: number, days: number, total: number) =>
    `${avg} RON × ${occ}% × ${days} days = ${total} RON/month`,
  initialState: 'Select a city and dates to see market prices.',
  emptyState: 'No listings found for the selected filters. Try adjusting dates or amenities.',
  retry: 'Try again',
  viewOnAirbnb: 'View on Airbnb',
  cachedNote: (date: string) => `Cached data — updated at ${date}`,
},
```

- [ ] **Step 5.2: Add nav item to layout.tsx**

In `src/app/dashboard/host/layout.tsx`, add the market intelligence nav item before Settings:

```typescript
{ href: '/dashboard/host/tasks', label: t.nav.tasks },
{ href: '/dashboard/host/market-intelligence', label: t.nav.marketIntelligence }, // ADD THIS
{ href: '/dashboard/host/settings', label: t.nav.settings },
```

- [ ] **Step 5.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v node_modules | head -20
```
Expected: no errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/lib/i18n.ts src/app/dashboard/host/layout.tsx
git commit -m "feat: add market intelligence nav item and i18n translations"
```

---

## Task 6: Market Intelligence page

**Files:**
- Create: `src/app/dashboard/host/market-intelligence/page.tsx`

This is a `'use client'` component. It has two panels: filters sidebar (left) and results panel (right).

- [ ] **Step 6.1: Implement the page**

Create `src/app/dashboard/host/market-intelligence/page.tsx`:

```tsx
'use client';

import { useState, useMemo } from 'react';
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
      citySearch === '' || c.name.toLowerCase().includes(citySearch.toLowerCase())
    ),
    [citySearch]
  );

  const cityGroups = useMemo(() => ({
    urban: filteredCities.filter(c => c.type === 'urban'),
    mountain: filteredCities.filter(c => c.type === 'mountain'),
    seaside: filteredCities.filter(c => c.type === 'seaside'),
    other: filteredCities.filter(c => c.type === 'other'),
  }), [filteredCities]);

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
      setErrorMsg('Eroare de rețea. Încearcă din nou.');
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📍 Oraș / Zonă</label>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={citySearch}
            onChange={e => setCitySearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
          />
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            size={6}
            className="w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selectează —</option>
            {cityGroups.urban.length > 0 && (
              <optgroup label="Orașe principale">
                {cityGroups.urban.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
            )}
            {cityGroups.mountain.length > 0 && (
              <optgroup label="Stațiuni montane">
                {cityGroups.mountain.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
            )}
            {cityGroups.seaside.length > 0 && (
              <optgroup label="Litoral">
                {cityGroups.seaside.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
            )}
            {cityGroups.other.length > 0 && (
              <optgroup label="Alte zone turistice">
                {cityGroups.other.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
            )}
          </select>
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
            Se caută listări...
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
```

- [ ] **Step 6.2: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "market-intelligence" | grep -v node_modules | head -20
```
Expected: no errors.

- [ ] **Step 6.3: Start dev server and smoke-test**

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard/host/market-intelligence` (log in as a host first).

Verify:
- Nav shows "Prețuri Piață" between Tasks and Settings
- Filter sidebar renders with city dropdown, guests, dates, amenities checkboxes
- City search filters the list as you type
- Search button is disabled until city + dates are filled
- Selecting a city and clicking Search shows loading state, then results (or error from Airbnb)
- Revenue estimator shows formula with correct defaults

- [ ] **Step 6.4: Commit**

```bash
git add src/app/dashboard/host/market-intelligence/page.tsx
git commit -m "feat: add Market Intelligence page with filters, listing cards, revenue estimator"
```

---

## Final Verification

- [ ] **Run all tests**

```bash
npm run test:run 2>&1 | tail -20
```
Expected: all tests pass, no regressions.

- [ ] **Run build**

```bash
npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

- [ ] **Run lint**

```bash
npm run lint 2>&1 | grep -v "^$" | head -20
```
Expected: no errors (warnings are acceptable).
