'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface Props {
  role: 'guest' | 'host';
}

export function MessagesList({ role }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings?role=${role}`).then(r => r.json()).then(d => {
      setBookings(d.bookings || []);
      setLoading(false);
    });
  }, [role]);

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  const basePath = role === 'host' ? '/dashboard/host/bookings' : '/dashboard/guest/bookings';

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        message="Nu ai conversații active."
        action={role === 'guest' ? { label: 'Caută cazare', href: '/search' } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map(b => (
        <Link key={b.id} href={`${basePath}/${b.id}`} className="block">
          <div className="card hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                {b.property.images?.[0] && <Image src={b.property.images[0].url} alt={b.property.title} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{b.property.title}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {role === 'guest' ? `Gazdă: ${b.host.name}` : `Oaspete: ${b.guest.name}`} · {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
