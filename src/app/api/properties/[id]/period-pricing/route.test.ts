import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  jsonMock: vi.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    body,
  })),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockGetSession: vi.fn(),
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
    periodPricing: {
      create: mocks.mockCreate,
      update: mocks.mockUpdate,
      delete: mocks.mockDelete,
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: mocks.mockGetSession,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => mocks.childLogger),
  },
}));

import { GET, POST, PUT, DELETE } from './route';

describe('period-pricing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFindUnique.mockReset();
    mocks.mockCreate.mockReset();
    mocks.mockUpdate.mockReset();
    mocks.mockDelete.mockReset();
    mocks.mockGetSession.mockReset();
    mocks.childLogger.info.mockClear();
    mocks.childLogger.warn.mockClear();
    mocks.childLogger.error.mockClear();
    mocks.childLogger.debug.mockClear();
  });

  it('returns 404 when property missing on list', async () => {
    mocks.mockFindUnique.mockResolvedValue(null);

    const res = await GET({} as any, { params: { id: 'prop-404' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'Proprietatea nu a fost gasita' }, { status: 404 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Property not found when listing period pricing',
      expect.objectContaining({ propertyId: 'prop-404' })
    );
    expect(res.status).toBe(404);
  });

  it('returns period pricings for property', async () => {
    const periods = [{ id: 'p1', name: 'Winter', startDate: '2025-01-01', endDate: '2025-02-01', pricePerNight: 150 }];
    mocks.mockFindUnique.mockResolvedValue({ periodPricings: periods });

    const res = await GET({} as any, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ periodPricings: periods });
    expect(res.body).toEqual({ periodPricings: periods });
    expect(mocks.childLogger.debug).toHaveBeenCalledWith(
      'Fetched period pricing list',
      expect.objectContaining({ propertyId: 'prop-1', count: 1 })
    );
  });

  it('blocks create when unauthenticated', async () => {
    mocks.mockGetSession.mockResolvedValue(null);

    const res = await POST({ json: vi.fn() } as any, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'Neautorizat' }, { status: 401 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Unauthorized period pricing create attempt',
      expect.objectContaining({ propertyId: 'prop-1' })
    );
    expect(res.status).toBe(401);
  });

  it('blocks create when user is not host/admin', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'other', role: 'GUEST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });

    const res = await POST({ json: vi.fn().mockResolvedValue({}) } as any, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'Acces interzis' }, { status: 403 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Forbidden period pricing create attempt',
      expect.objectContaining({ propertyId: 'prop-1', userId: 'other' })
    );
    expect(res.status).toBe(403);
  });

  it('creates a period pricing for host', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });
    const body = {
      name: 'Summer',
      startDate: '2025-06-01',
      endDate: '2025-06-10',
      pricePerNight: 180,
    };
    const created = { id: 'p1', ...body, propertyId: 'prop-1' };
    mocks.mockCreate.mockResolvedValue(created as any);

    const res = await POST({ json: vi.fn().mockResolvedValue(body) } as any, { params: { id: 'prop-1' } });

    expect(mocks.mockCreate).toHaveBeenCalledWith({
      data: {
        propertyId: 'prop-1',
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        pricePerNight: body.pricePerNight,
      },
    });
    expect(mocks.jsonMock).toHaveBeenCalledWith({ periodPricing: created }, { status: 201 });
    expect(res.status).toBe(201);
    expect(mocks.childLogger.info).toHaveBeenCalledWith(
      'Created period pricing',
      expect.objectContaining({ propertyId: 'prop-1', periodPricingId: 'p1' })
    );
  });

  it('returns 400 on validation errors for create', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });

    const invalidBody = { name: '', startDate: '2025-06-01', endDate: '2025-06-10', pricePerNight: 0 };

    const res = await POST({ json: vi.fn().mockResolvedValue(invalidBody) } as any, { params: { id: 'prop-1' } });

    expect(res.status).toBe(400);
    expect(mocks.childLogger.error).toHaveBeenCalled();
  });

  it('requires id on update', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });
    const validButMissingId = {
      name: 'Updated',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      pricePerNight: 200,
    };

    const res = await PUT({ json: vi.fn().mockResolvedValue(validButMissingId) } as any, {
      params: { id: 'prop-1' },
    });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'ID-ul perioadei este necesar' }, { status: 400 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Missing period pricing id for update',
      expect.objectContaining({ propertyId: 'prop-1' })
    );
    expect(res.status).toBe(400);
  });

  it('updates a period pricing', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });
    const body = {
      id: 'p1',
      name: 'Updated',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      pricePerNight: 220,
    };
    const updated = { ...body, propertyId: 'prop-1' };
    mocks.mockUpdate.mockResolvedValue(updated as any);

    const res = await PUT({ json: vi.fn().mockResolvedValue(body) } as any, { params: { id: 'prop-1' } });

    expect(mocks.mockUpdate).toHaveBeenCalledWith({
      where: { id: 'p1', propertyId: 'prop-1' },
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        pricePerNight: body.pricePerNight,
      },
    });
    expect(mocks.jsonMock).toHaveBeenCalledWith({ periodPricing: updated });
    expect(res.status).toBe(200);
    expect(mocks.childLogger.info).toHaveBeenCalledWith(
      'Updated period pricing',
      expect.objectContaining({ periodPricingId: 'p1' })
    );
  });

  it('requires id on delete', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });

    const res = await DELETE({ json: vi.fn().mockResolvedValue({}) } as any, { params: { id: 'prop-1' } });

    expect(mocks.jsonMock).toHaveBeenCalledWith({ error: 'ID-ul perioadei este necesar' }, { status: 400 });
    expect(mocks.childLogger.warn).toHaveBeenCalledWith(
      'Missing period pricing id for delete',
      expect.objectContaining({ propertyId: 'prop-1' })
    );
    expect(res.status).toBe(400);
  });

  it('deletes a period pricing', async () => {
    mocks.mockGetSession.mockResolvedValue({ userId: 'host-1', role: 'HOST' });
    mocks.mockFindUnique.mockResolvedValue({ hostId: 'host-1' });
    mocks.mockDelete.mockResolvedValue({});

    const res = await DELETE({ json: vi.fn().mockResolvedValue({ id: 'p1' }) } as any, { params: { id: 'prop-1' } });

    expect(mocks.mockDelete).toHaveBeenCalledWith({ where: { id: 'p1', propertyId: 'prop-1' } });
    expect(mocks.jsonMock).toHaveBeenCalledWith({ ok: true });
    expect(res.status).toBe(200);
    expect(mocks.childLogger.info).toHaveBeenCalledWith(
      'Deleted period pricing',
      expect.objectContaining({ periodPricingId: 'p1' })
    );
  });
});
