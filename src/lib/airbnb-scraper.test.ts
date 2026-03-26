import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAirbnb } from './airbnb-scraper';

function makeHtml(searchResults: unknown[]): string {
  const payload = {
    data: {
      presentation: {
        __typename: 'RootPresentationContainer',
        staysSearch: {
          __typename: 'StaysSearchPresentation',
          results: { searchResults },
        },
      },
    },
  };
  return `<html><body>${JSON.stringify(payload)}</body></html>`;
}

const validRaw = {
  title: 'Apartament Cluj',
  avgRatingLocalized: '4,85 (42)',
  contextualPictures: [{ picture: 'https://img.example.com/photo.jpg' }],
  structuredDisplayPrice: {
    explanationData: {
      priceDetails: [{
        items: [{ description: '6\u00a0nopți x 245,00\u00a0lei' }],
      }],
    },
  },
  demandStayListing: { id: Buffer.from('DemandStayListing:12345678').toString('base64') },
};

describe('searchAirbnb', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty array when no searchResults in HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html>no data</html>',
    }));

    const results = await searchAirbnb({
      city: 'Cluj-Napoca', guests: 2,
      checkin: '2026-07-01', checkout: '2026-07-07', amenities: [],
    });
    expect(results).toEqual([]);
  });

  it('parses listing fields from embedded HTML JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => makeHtml([validRaw]),
    }));

    const results = await searchAirbnb({
      city: 'Cluj-Napoca', guests: 2,
      checkin: '2026-07-01', checkout: '2026-07-07', amenities: [],
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('12345678');
    expect(results[0].title).toBe('Apartament Cluj');
    expect(results[0].pricePerNight).toBe(245);
    expect(results[0].rating).toBe(4.85);
    expect(results[0].reviewCount).toBe(42);
    expect(results[0].url).toBe('https://www.airbnb.com/rooms/12345678');
    expect(Array.isArray(results[0].amenities)).toBe(true);
  });

  it('throws when fetch returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '',
    }));

    await expect(
      searchAirbnb({ city: 'Mamaia', guests: 2, checkin: '2026-07-01', checkout: '2026-07-07', amenities: [] })
    ).rejects.toThrow('403');
  });
});
