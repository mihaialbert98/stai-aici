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

// Airbnb's internal amenity filter codes for URL query params
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

// Parse Romanian-locale number: "148,95" → 148.95, "1.200,50" → 1200.50
function parseRomanianNumber(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Extract per-night price from explanation text like "16\xa0nopți x 148,95\xa0lei"
function parsePriceFromExplanation(result: RawSearchResult): number {
  try {
    const groups = result.structuredDisplayPrice?.explanationData?.priceDetails ?? [];
    for (const group of groups) {
      for (const item of group.items ?? []) {
        const desc = item.description ?? '';
        const m = desc.match(/[\d.,]+\s+(?:nop[tț]i|noapte)\s+x\s+([\d.,]+)/);
        if (m) return Math.round(parseRomanianNumber(m[1]));
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

// Parse rating and review count from "4,82 (83)" or null for new/unrated
function parseRating(str: string | null | undefined): { rating: number | null; reviewCount: number } {
  if (!str) return { rating: null, reviewCount: 0 };
  const m = str.match(/([\d,]+)\s*\((\d+)\)/);
  if (!m) return { rating: null, reviewCount: 0 };
  return {
    rating: parseRomanianNumber(m[1]),
    reviewCount: parseInt(m[2], 10),
  };
}

// Decode Airbnb base64 relay ID like "RGVtYW5kU3RheUxpc3Rpbmc6NTI0MjIwNTc=" → "52422057"
function decodeListingId(b64: string): string {
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    return decoded.split(':').pop() ?? '';
  } catch {
    return '';
  }
}

interface RawPriceLine {
  description?: string;
}

interface RawPriceGroup {
  items?: RawPriceLine[];
}

interface RawSearchResult {
  title?: string;
  avgRatingLocalized?: string | null;
  contextualPictures?: Array<{ picture?: string }>;
  structuredDisplayPrice?: {
    explanationData?: {
      priceDetails?: RawPriceGroup[];
    };
  };
  demandStayListing?: {
    id?: string;
  };
}

function extractSearchResults(html: string): RawSearchResult[] {
  // The search results are embedded as {"data":{"presentation":{"staysSearch":...}}}
  const marker = '"staysSearch":{"__typename":"StaysSearchPresentation"';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return [];

  // Find the {"data": block that contains this marker
  const dataTag = '{"data":';
  const dataIdx = html.lastIndexOf(dataTag, markerIdx);
  if (dataIdx === -1) return [];

  // Extract the full JSON object
  let depth = 0;
  let end = dataIdx;
  for (let i = dataIdx; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  try {
    const obj = JSON.parse(html.slice(dataIdx, end + 1)) as {
      data?: { presentation?: { staysSearch?: { results?: { searchResults?: RawSearchResult[] } } } };
    };
    return obj?.data?.presentation?.staysSearch?.results?.searchResults ?? [];
  } catch {
    return [];
  }
}

export async function searchAirbnb(params: {
  city: string;
  guests: number;
  checkin: string;
  checkout: string;
  amenities: AmenityKey[];
}): Promise<AirbnbListing[]> {
  const { city, guests, checkin, checkout, amenities } = params;

  const urlParams = new URLSearchParams({
    checkin,
    checkout,
    adults: String(guests),
    currency: 'RON',
  });
  for (const amenity of amenities) {
    urlParams.append('amenities[]', AMENITY_FILTER_IDS[amenity]);
  }

  const url = `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes?${urlParams}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Airbnb returned ${response.status}`);
    }

    html = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const rawResults = extractSearchResults(html);

  const listings: AirbnbListing[] = [];
  for (const raw of rawResults) {
    const pricePerNight = parsePriceFromExplanation(raw);
    if (!pricePerNight) continue;

    const listingId = decodeListingId(raw.demandStayListing?.id ?? '');
    if (!listingId) continue;

    const { rating, reviewCount } = parseRating(raw.avgRatingLocalized);

    listings.push({
      id: listingId,
      title: raw.title ?? '',
      type: '',
      pricePerNight,
      rating,
      reviewCount,
      amenities: [],
      thumbnail: raw.contextualPictures?.[0]?.picture ?? '',
      url: `https://www.airbnb.com/rooms/${listingId}`,
    });

    if (listings.length >= 200) break;
  }

  return listings;
}
