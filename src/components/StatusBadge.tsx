import { statusLabel, statusColor } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
