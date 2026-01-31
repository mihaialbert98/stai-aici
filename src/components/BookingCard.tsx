import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRON, formatDate } from '@/lib/utils';

interface Props {
  booking: any;
  href: string;
  subtitle?: string;
}

export function BookingCard({ booking, href, subtitle }: Props) {
  return (
    <Link href={href} className="block">
      <div className="card hover:shadow-md transition flex gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          {booking.property.images?.[0] && (
            <img src={booking.property.images[0].url} className="w-full h-full object-cover" alt="" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{booking.property.title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          <p className="text-sm text-gray-500 mt-1">{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</p>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={booking.status} />
            <span className="text-sm font-medium text-primary-600">{formatRON(booking.totalPrice)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
