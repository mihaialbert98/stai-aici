import { statusLabel, statusColor } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColor(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
