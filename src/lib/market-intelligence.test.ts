// src/lib/market-intelligence.test.ts
import { describe, it, expect } from 'vitest';
import {
  ROMANIAN_CITIES,
  AMENITY_KEYS,
  getOccupancyDefault,
  computeStats,
} from './market-intelligence';

describe('ROMANIAN_CITIES', () => {
  it('contains at least 90 entries', () => {
    expect(ROMANIAN_CITIES.length).toBeGreaterThanOrEqual(90);
  });
  it('has required fields on every entry', () => {
    for (const c of ROMANIAN_CITIES) {
      expect(c.name).toBeTruthy();
      expect(['urban', 'mountain', 'seaside', 'other']).toContain(c.type);
    }
  });
  it('includes Cluj-Napoca and Mamaia', () => {
    const names = ROMANIAN_CITIES.map(c => c.name);
    expect(names).toContain('Cluj-Napoca');
    expect(names).toContain('Mamaia');
  });
});

describe('AMENITY_KEYS', () => {
  it('has exactly 8 entries', () => {
    expect(Object.keys(AMENITY_KEYS)).toHaveLength(8);
  });
  it('includes all required keys', () => {
    const keys = Object.keys(AMENITY_KEYS);
    for (const k of ['parking','pool','wifi','ac','kitchen','pets','washer','balcony']) {
      expect(keys).toContain(k);
    }
  });
});

describe('getOccupancyDefault', () => {
  it('returns 85 for Mamaia in July (seaside high season)', () => {
    expect(getOccupancyDefault('Mamaia', 7)).toBe(85);
  });
  it('returns 40 for Mamaia in January (seaside low season)', () => {
    expect(getOccupancyDefault('Mamaia', 1)).toBe(40);
  });
  it('returns 80 for Sinaia in January (mountain high season)', () => {
    expect(getOccupancyDefault('Sinaia', 1)).toBe(80);
  });
  it('returns 60 for Sinaia in May (mountain low season)', () => {
    expect(getOccupancyDefault('Sinaia', 5)).toBe(60);
  });
  it('returns 70 for Cluj-Napoca in any summer month (urban)', () => {
    expect(getOccupancyDefault('Cluj-Napoca', 6)).toBe(70);
  });
  it('returns 60 for Cluj-Napoca in December (urban low)', () => {
    expect(getOccupancyDefault('Cluj-Napoca', 12)).toBe(60);
  });
  it('returns 65 for Sighișoara in August (other high)', () => {
    expect(getOccupancyDefault('Sighișoara', 8)).toBe(65);
  });
  it('returns 50 for unknown city in any month', () => {
    expect(getOccupancyDefault('Unknown City', 5)).toBe(50);
  });
});

describe('computeStats', () => {
  it('computes avg, median, min, max, count correctly', () => {
    const prices = [100, 200, 300, 400, 500];
    const stats = computeStats(prices);
    expect(stats.avg).toBe(300);
    expect(stats.median).toBe(300);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(500);
    expect(stats.count).toBe(5);
  });
  it('handles even-length array for median', () => {
    const prices = [100, 200, 300, 400];
    expect(computeStats(prices).median).toBe(250);
  });
  it('returns zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats.avg).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.count).toBe(0);
  });
});
