import { describe, it, expect } from 'vitest';
import {
  formatRON,
  formatDate,
  formatDateShort,
  nightsBetween,
  statusLabel,
  statusColor,
  removeDiacritics,
} from '../utils';

describe('formatRON', () => {
  it('formats integer amounts correctly', () => {
    expect(formatRON(100)).toBe('100 RON');
    expect(formatRON(1000)).toBe('1.000 RON');
    expect(formatRON(1000000)).toBe('1.000.000 RON');
  });

  it('formats decimal amounts correctly', () => {
    expect(formatRON(99.5)).toBe('99,5 RON');
    expect(formatRON(1234.56)).toBe('1.234,56 RON');
  });

  it('handles zero', () => {
    expect(formatRON(0)).toBe('0 RON');
  });
});

describe('formatDate', () => {
  it('formats Date objects', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/mar/i);
    expect(result).toMatch(/2024/);
  });

  it('formats date strings', () => {
    const result = formatDate('2024-12-25');
    expect(result).toMatch(/25/);
    expect(result).toMatch(/dec/i);
    expect(result).toMatch(/2024/);
  });
});

describe('formatDateShort', () => {
  it('formats without year', () => {
    const result = formatDateShort('2024-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/mar/i);
    expect(result).not.toMatch(/2024/);
  });
});

describe('nightsBetween', () => {
  it('calculates nights correctly', () => {
    expect(nightsBetween('2024-03-01', '2024-03-05')).toBe(4);
    expect(nightsBetween('2024-03-01', '2024-03-02')).toBe(1);
  });

  it('handles Date objects', () => {
    const start = new Date('2024-03-01');
    const end = new Date('2024-03-10');
    expect(nightsBetween(start, end)).toBe(9);
  });

  it('returns 0 for same date', () => {
    expect(nightsBetween('2024-03-01', '2024-03-01')).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(nightsBetween('2024-02-28', '2024-03-02')).toBe(3);
  });
});

describe('statusLabel', () => {
  it('returns Romanian label for known statuses', () => {
    expect(statusLabel('PENDING')).toBe('În așteptare');
    expect(statusLabel('ACCEPTED')).toBe('Acceptată');
    expect(statusLabel('REJECTED')).toBe('Refuzată');
    expect(statusLabel('CANCELLED')).toBe('Anulată');
  });

  it('returns original string for unknown status', () => {
    expect(statusLabel('UNKNOWN')).toBe('UNKNOWN');
    expect(statusLabel('custom')).toBe('custom');
  });
});

describe('statusColor', () => {
  it('returns correct color classes for known statuses', () => {
    expect(statusColor('PENDING')).toBe('bg-yellow-100 text-yellow-800');
    expect(statusColor('ACCEPTED')).toBe('bg-green-100 text-green-800');
    expect(statusColor('REJECTED')).toBe('bg-red-100 text-red-800');
    expect(statusColor('CANCELLED')).toBe('bg-gray-100 text-gray-800');
  });

  it('returns default gray for unknown status', () => {
    expect(statusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
  });
});

describe('removeDiacritics', () => {
  it('removes Romanian diacritics', () => {
    expect(removeDiacritics('Brașov')).toBe('Brasov');
    expect(removeDiacritics('București')).toBe('Bucuresti');
    expect(removeDiacritics('Iași')).toBe('Iasi');
    expect(removeDiacritics('Constanța')).toBe('Constanta');
  });

  it('handles strings without diacritics', () => {
    expect(removeDiacritics('Bucharest')).toBe('Bucharest');
    expect(removeDiacritics('test')).toBe('test');
  });

  it('handles mixed diacritics', () => {
    expect(removeDiacritics('Făgăraș Mountains')).toBe('Fagaras Mountains');
  });

  it('handles empty string', () => {
    expect(removeDiacritics('')).toBe('');
  });
});
