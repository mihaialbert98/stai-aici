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
import { searchAirbnb } from '@/lib/airbnb-scraper';

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
    vi.mocked(prisma.marketSearchCache.findUnique).mockResolvedValue(null);
    vi.mocked(searchAirbnb).mockResolvedValue([]);
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

  it('returns 403 when role is GUEST', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'GUEST', email: 'g@test.com' } as any);
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(403);
  });

  it('returns 200 when role is ADMIN', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'u1', role: 'ADMIN', email: 'a@test.com' } as any);
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(200);
  });

  it('returns 502 when Airbnb returns 403', async () => {
    vi.mocked(searchAirbnb).mockRejectedValueOnce(new Error('Airbnb API returned 403'));
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(502);
  });

  it('returns 504 when Airbnb times out', async () => {
    vi.mocked(searchAirbnb).mockRejectedValueOnce(new Error('The operation was aborted'));
    const res = await GET(makeRequest(validParams));
    expect(res.status).toBe(504);
  });
});
