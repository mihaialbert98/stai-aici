import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) store.delete(key);
  });
}, 5 * 60 * 1000);

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * Rate limit by IP. Returns null if allowed, or a 429 Response if blocked.
 * @param req - NextRequest
 * @param limit - max requests per window
 * @param windowMs - window duration in ms
 * @param prefix - key prefix to separate different endpoints
 */
export function rateLimit(
  req: NextRequest,
  { limit = 5, windowMs = 15 * 60 * 1000, prefix = 'global' }:
  { limit?: number; windowMs?: number; prefix?: string } = {}
): NextResponse | null {
  const ip = getIP(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Prea multe încercări. Încearcă din nou mai târziu.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  return null;
}
