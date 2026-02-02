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

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
