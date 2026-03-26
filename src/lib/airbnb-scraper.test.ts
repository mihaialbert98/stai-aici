import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAirbnb } from './airbnb-scraper';

describe('searchAirbnb', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an array', async () => {
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

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('pricePerNight');
    expect(results[0]).toHaveProperty('amenities');
    expect(Array.isArray(results[0].amenities)).toBe(true);
  });

  it('throws when fetch returns 403', async () => {
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
