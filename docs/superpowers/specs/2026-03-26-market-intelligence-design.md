# Market Intelligence Page — Design Spec

**Date:** 2026-03-26
**Project:** StayViara (stai-aici)
**Status:** Approved for implementation

---

## Overview

A new host dashboard page that lets hosts research nightly pricing for short-term rentals in any Romanian city or resort area. The host selects filters (location, guests, dates, amenities), the system scrapes Airbnb's internal API for matching listings, and presents average/median prices, individual listing cards, and an estimated monthly revenue calculator.

---

## Goals

- Help hosts price their listings competitively
- Show market context: avg price, median, price range, individual comps
- Estimate monthly revenue based on market prices + occupancy assumptions
- No new dependencies beyond what's already installed (except Playwright for scraping if needed — but approach A avoids this)

---

## Data Source

**Airbnb internal GraphQL API (reverse-engineered).**

- The same endpoint Airbnb's website uses for search
- Called server-side from a Next.js API route
- No Playwright or headless browser needed — pure HTTP GraphQL calls
- Fields extracted per listing: title, type, nightly price, amenities, rating, review count, thumbnail URL, listing URL
- Max 200 results per search

**Why not official API:** Airbnb's official API is partner-only and not accepting applications. Unofficial npm packages are 7+ years old and broken. Reverse-engineering the internal GraphQL endpoint is the most reliable approach without extra infrastructure.

**Legal context (Romania/EU):** Scraping publicly visible search results (no login required) carries no criminal liability under Romanian law (Law 161/2003). Civil risk is minimal for a small SaaS — platforms typically block rather than litigate. Only publicly visible, non-authenticated data is accessed.

---

## Caching

- Cache key: MD5 hash of `{ city, guests, checkin, checkout, amenities[] }`
- TTL: 24 hours
- Storage: new `MarketSearchCache` Prisma model
- On each request: expire stale rows first, then check for cache hit
- Avoids hammering Airbnb on repeated identical searches

---

## Database

New model added to `prisma/schema.prisma`:

```prisma
model MarketSearchCache {
  id        String   @id @default(cuid())
  cacheKey  String   @unique
  results   Json
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

---

## Page Location

- URL: `/dashboard/host/market-intelligence`
- Nav label: **Prețuri Piață** (or "Market Intelligence")
- Position: 9th item in host dashboard nav (after Tasks, before Settings)
- Role access: HOST and ADMIN only (existing middleware covers this)

---

## UI Layout — Left Sidebar + Results Panel

```
┌─────────────────────────────────────────────────────────┐
│  Host Dashboard Nav (existing)                          │
├──────────────┬──────────────────────────────────────────┤
│              │  Stats Row                               │
│  FILTERS     │  ┌──────────┬──────────┬──────────────┐  │
│              │  │ 245 RON  │ 210 RON  │  4,900 RON   │  │
│  📍 City     │  │ avg/noapte│ median  │ venit est/lună│  │
│  (searchable │  └──────────┴──────────┴──────────────┘  │
│  dropdown)   │                                          │
│              │  Listings (list)                         │
│  👥 Guests   │  ┌────────────────────────────────────┐  │
│  (number)    │  │ 🏠 Apt 2 cam · parking · WiFi      │  │
│              │  │ ★ 4.8 (32) · 280 RON/noapte        │  │
│  📅 Check-in │  ├────────────────────────────────────┤  │
│  📅 Check-out│  │ 🏠 Garsonieră · WiFi · bucătărie   │  │
│              │  │ ★ 4.6 (18) · 195 RON/noapte        │  │
│  Facilități: │  ├────────────────────────────────────┤  │
│  ☐ Parcare   │  │ ...up to 200 listings              │  │
│  ☐ Piscină   │  └────────────────────────────────────┘  │
│  ☐ WiFi      │                                          │
│  ☐ AC        │  Revenue Estimator                       │
│  ☐ Bucătărie │  ┌────────────────────────────────────┐  │
│  ☐ Animale   │  │ Perioadă: 30 zile                  │  │
│  ☐ Mașină    │  │ Ocupare: [70]%  (editabil)         │  │
│    spălat    │  │ 245 × 70% × 30 = 5,145 RON/lună    │  │
│  ☐ Balcon    │  └────────────────────────────────────┘  │
│              │                                          │
│  [Caută]     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Filters

### City / Zonă (searchable dropdown)

~100 Romanian locations grouped by type:

**Orașe principale:**
București, Cluj-Napoca, Timișoara, Iași, Constanța, Craiova, Brașov, Galați, Ploiești, Oradea, Sibiu, Bacău, Suceava, Piatra Neamț, Târgu Mureș, Baia Mare, Alba Iulia, Deva, Satu Mare, Botoșani, Râmnicu Vâlcea, Buzău, Focșani, Bistrița, Sfântu Gheorghe, Miercurea Ciuc, Turda, Mediaș, Lugoj, Câmpina, Petroșani, Câmpulung, Roman, Zalău, Drobeta-Turnu Severin, Hunedoara, Medgidia, Reșița, Giurgiu, Slobozia, Alexandria, Târgoviște, Onești, Adjud, Mioveni, Arad, Pitești, Brăila, Buzău, Râmnicu Sărat

**Stațiuni montane:**
Sinaia, Predeal, Poiana Brașov, Bușteni, Azuga, Vatra Dornei, Sovata, Băile Herculane, Băile Felix, Băile Tușnad, Covasna, Bran, Moeciu, Fundata, Rânca, Straja, Păltiniș, Semenic, Râșnov, Zărnești, Borșa, Arieșeni

**Litoral:**
Mamaia, Eforie Nord, Eforie Sud, Neptun, Olimp, Jupiter, Venus, Saturn, Mangalia, Năvodari, Techirghiol, Costinești, 2 Mai, Vama Veche

**Alte zone turistice:**
Sighișoara, Sulina, Tulcea, Cheile Bicazului, Murighiol, Crișan, Mila 23, Lacul Roșu, Cheile Nerei, Certeze, Harghita-Băi, Peștera, Moieciu de Sus, Delta Dunării

### Număr oaspeți
- Number input, min 1, max 16

### Perioadă
- Check-in date picker
- Check-out date picker
- Both required for search (Airbnb requires dates to show prices)

### Facilități (checkboxes, all optional)
- Parcare
- Piscină
- WiFi
- Aer condiționat
- Bucătărie
- Animale de companie acceptate
- Mașină de spălat / uscător
- Balcon / terasă

---

## Stats Row (shown after search)

| Stat | Description |
|------|-------------|
| Preț mediu/noapte | Mean nightly price across all results |
| Preț median/noapte | Median nightly price (more robust to outliers) |
| Interval | Min – Max nightly price |
| Nr. listări | Count of listings returned |

---

## Listing Cards (list style)

Each card shows:
- Thumbnail image (from Airbnb)
- Title + property type
- Star rating + review count
- Amenities icons (matching selected filters highlighted)
- Nightly price (RON)
- Link to view on Airbnb (opens in new tab)

---

## Revenue Estimator

Shown below the listings. Inputs are editable by the host.

**Inputs:**
- Perioadă (days) — auto-filled from check-in/check-out date difference, editable
- Rată ocupare (%) — pre-filled smart default (see table below), editable

**Formula (shown transparently):**
```
Preț mediu/noapte × Rată ocupare × Zile = Venit estimat
```

**Smart defaults for occupancy %:**

| Location type | High season | Low season |
|---------------|-------------|------------|
| Litoral (Mamaia, Eforie, Neptun, Olimp, Jupiter, Venus, Saturn, Mangalia, Năvodari, Techirghiol, Costinești, 2 Mai, Vama Veche, Eforie Sud) | 85% (Jun–Aug) | 40% |
| Montan (Sinaia, Predeal, Poiana Brașov, Bușteni, Azuga, Vatra Dornei, Borșa, Rânca, Straja, Arieșeni) | 80% (Dec–Feb) | 60% |
| Urban (all major cities) | 70% year-round | 60% (Nov–Mar) |
| Alte zone turistice | 65% | 50% |

Season is determined from the check-in month selected by the user.

---

## API Route

**Endpoint:** `GET /api/host/market-intelligence`

**Query params:**
- `city` — string (must be in allowed cities list)
- `guests` — integer 1–16
- `checkin` — ISO date string
- `checkout` — ISO date string
- `amenities` — comma-separated list of amenity keys

**Auth:** Session required, HOST or ADMIN role

**Response:**
```json
{
  "listings": [
    {
      "id": "...",
      "title": "...",
      "type": "...",
      "pricePerNight": 245,
      "rating": 4.8,
      "reviewCount": 32,
      "amenities": ["wifi", "parking"],
      "thumbnail": "https://...",
      "url": "https://airbnb.com/rooms/..."
    }
  ],
  "stats": {
    "avg": 245,
    "median": 210,
    "min": 120,
    "max": 680,
    "count": 147
  },
  "cached": true,
  "cachedAt": "2026-03-26T10:00:00Z"
}
```

**Logic:**
1. Validate inputs with Zod (city must be in allowlist, guests 1–16, dates valid range, amenities subset of allowed list)
2. Compute cache key: `md5(JSON.stringify({ city, guests, checkin, checkout, amenities: amenities.sort() }))`
3. Delete expired cache entries
4. Return cached result if found
5. Call Airbnb internal GraphQL search API with filters
6. Parse response, extract listing fields
7. Compute stats (avg, median, min, max)
8. Store in `MarketSearchCache` with 24h TTL
9. Return response

---

## Files

### New files
- `src/app/dashboard/host/market-intelligence/page.tsx` — page component
- `src/app/api/host/market-intelligence/route.ts` — API route
- `src/lib/airbnb-scraper.ts` — Airbnb internal API caller + parser
- `src/lib/market-intelligence.ts` — stats computation, occupancy defaults, city allowlist

### Modified files
- `prisma/schema.prisma` — add `MarketSearchCache` model
- `prisma/migrations/` — new migration for `MarketSearchCache`
- `src/app/dashboard/host/layout.tsx` — add nav item "Prețuri Piață"

---

## Out of Scope (v1)

- Booking.com data
- Price history / trends over time
- Map view of listings
- Saving/exporting search results
- Price alerts
- Comparing multiple cities side by side
