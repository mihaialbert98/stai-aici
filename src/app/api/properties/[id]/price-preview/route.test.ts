import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  jsonMock: vi.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    body,
  })),
  mockFindUnique: vi.fn(),
  mockCalculate: vi.fn(),
  childLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('next/server', () => ({
  NextResponse: { json: mocks.jsonMock },
  NextRequest: class {},
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: mocks.mockFindUnique,
    },
  },
}));

vi.mock('@/lib/pricing', () => ({
  calculateBookingPrice: mocks.mockCalculate,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => mocks.childLogger),
  },
}));

import { GET } from './route';

const makeRequest = (url: string) => ({ nextUrl: new URL(url) } as any);

describe('price-preview API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when dates are missing', async () => {
    const req = makeRequest('http://localhost/api?guests=2');

    const res = await GET(req, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'Datele sunt necesare' }, { status: 400 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Missing dates for price preview',
      expect.objectContaining({ propertyId: 'prop-1' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when property is not found', async () => {
    mocks.mockFindUnique.mockResolvedValue(null);
    const req = makeRequest('http://localhost/api?startDate=2025-06-01&endDate=2025-06-03&guests=2');

    const res = await GET(req, { params: { id: 'prop-404' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Property not found for price preview',
      expect.objectContaining({ propertyId: 'prop-404' })
    );
    expect(res.status).toBe(404);
  });

  it('returns calculated breakdown for valid inputs', async () => {
    const property = {
      pricePerNight: 200,
      baseGuests: 2,
      extraGuestPrice: 50,
      periodPricings: [],
    };
    const breakdown = {
      nightlyPrices: [],
      basePrice: 600,
      extraGuestFee: 0,
      totalPrice: 600,
      nights: 3,
      extraGuests: 0,
      normalPrice: 600,
      savings: 0,
    };

    mocks.mockFindUnique.mockResolvedValue(property);
    mocks.mockCalculate.mockReturnValue(breakdown);

    const req = makeRequest('http://localhost/api?startDate=2025-06-01&endDate=2025-06-04&guests=3');

    const res = await GET(req, { params: { id: 'prop-1' } });

    expect(mocks.mockCalculate).toHaveBeenCalledWith({
      property,
      startDate: '2025-06-01',
      endDate: '2025-06-04',
      guests: 3,
    });
    expect(res.body).toEqual({ breakdown });
    expect(res.status).toBe(200);
    expect(mocks.childLogger.info).toHaveBeenCalledWith(
      'Calculated price preview',
      expect.objectContaining({ propertyId: 'prop-1', totalPrice: 600, nights: 3 })
    );
  });

  it('logs and returns 500 on unexpected errors', async () => {
    mocks.mockFindUnique.mockRejectedValue(new Error('db down'));
    const req = makeRequest('http://localhost/api?startDate=2025-06-01&endDate=2025-06-04&guests=2');

    const res = await GET(req, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith(
      { error: 'Eroare la calcularea pretului' },
      { status: 500 }
    );
    expect(mocks.childLogger.error).toHaveBeenCalled();
    expect(res.status).toBe(500);
  });
});
