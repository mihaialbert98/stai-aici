// src/lib/api-helpers.ts
// Shared utilities for API route handlers.
// Import from here instead of duplicating in individual routes.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ─── Standard error responses ────────────────────────────────────────────────

export const unauthorized = () =>
  NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: 'Acces interzis' }, { status: 403 });

export const notFound = (entity = 'Resursa') =>
  NextResponse.json({ error: `${entity} negăsită` }, { status: 404 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export const internalError = (err: unknown, context?: string) => {
  logger.error(context ?? 'API error', err);
  const isZod = (err as any)?.name === 'ZodError';
  return NextResponse.json(
    { error: isZod ? (err as any).message : 'Eroare internă' },
    { status: isZod ? 400 : 500 }
  );
};

// ─── Ownership helpers ────────────────────────────────────────────────────────

/**
 * Returns the property if it belongs to `userId`, null otherwise.
 * Used in all /api/properties/[id]/* routes.
 */
export async function getHostProperty(propertyId: string, userId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, hostId: userId },
    select: { id: true },
  });
}
