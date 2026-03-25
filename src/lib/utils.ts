import { differenceInDays, format } from 'date-fns';
import { ro } from 'date-fns/locale';

export function formatRON(amount: number): string {
  return `${amount.toLocaleString('ro-RO')} RON`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'd MMM yyyy', { locale: ro });
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'd MMM', { locale: ro });
}

export function nightsBetween(start: Date | string, end: Date | string): number {
  return differenceInDays(new Date(end), new Date(start));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'În așteptare',
    ACCEPTED: 'Acceptată',
    REJECTED: 'Refuzată',
    CANCELLED: 'Anulată',
  };
  return map[status] || status;
}

/** Strip diacritics so "Brasov" matches "Brașov" etc. */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Returns Tailwind classes for a booking/reservation status badge.
 * Single source of truth — replaces STATUS_STYLE / statusColor duplicates.
 */
export function statusBadgeClass(status: string): string {
  // Shades deliberately match the original statusColor() values to avoid visual regressions
  const map: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-800',
    ACCEPTED:  'bg-green-100 text-green-800',
    REJECTED:  'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    MANUAL:    'bg-blue-100 text-blue-800',
    SYNCED:    'bg-indigo-100 text-indigo-800',
    BLOCKED:   'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

/**
 * Legacy wrapper for backward compatibility.
 * Delegates to statusBadgeClass.
 */
export function statusColor(status: string): string {
  return statusBadgeClass(status);
}

/**
 * Convert a hex color string to rgba(...).
 * Falls back to indigo (#6366f1) if hex is invalid.
 */
export function hexToRgba(hex: string | undefined | null, alpha: number): string {
  const safe = (hex && /^#[0-9a-f]{6}$/i.test(hex)) ? hex : '#6366f1';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
