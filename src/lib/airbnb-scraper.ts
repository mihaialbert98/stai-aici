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
// These are the most common known IDs; mapping may need adjustment after live testing
const AIRBNB_AMENITY_MAP: Record<string, AmenityKey> = {
  '9': 'parking',
  '7': 'pool',
  '4': 'wifi',
  '5': 'ac',
  '8': 'kitchen',
  '12': 'pets',
  '33': 'washer',
  '31': 'balcony',
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

  const amenityFilters = amenities.map(k => ({
    field: 'amenities',
    value: AMENITY_FILTER_IDS[k],
  }));

  const apiKey = 'd306zoyjsyarp7ifhu67rjxn52tv0t20';

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

  const url = 'https://www.airbnb.com/api/v3/StaysSearch?operationName=StaysSearch&locale=ro&currency=RON';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Airbnb-API-Key': apiKey,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ro-RO,ro;q=0.9',
        'Referer': 'https://www.airbnb.com/',
        'Origin': 'https://www.airbnb.com',
      },
      body: JSON.stringify({
        operationName: 'StaysSearch',
        variables,
        extensions: {},
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Airbnb API returned ${response.status}`);
  }

  const json = await response.json();

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
      rating: listing.avgRatingA11yLabel
        ? parseFloat(String(listing.avgRatingA11yLabel))
        : null,
      reviewCount: listing.reviewsCount ?? 0,
      amenities: mapAmenities(listing.listingAmenities ?? []),
      thumbnail: listing.contextualPictures?.[0]?.picture ?? '',
      url: `https://www.airbnb.com/rooms/${listing.id}`,
    });

    if (listings.length >= 200) break;
  }

  return listings;
}
