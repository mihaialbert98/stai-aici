'use client';

import { useEffect, useState } from 'react';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { formatRON, formatDate } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  role: 'guest' | 'host';
}

export function BookingList({ role }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = (p = page) => {
    setLoading(true);
    fetch(`/api/bookings?role=${role}&page=${p}`).then(r => r.json()).then(d => {
      setBookings(d.bookings || []);
      setTotalPages(d.pages || 1);
      setLoading(false);
    });
  };

  useEffect(() => { fetchBookings(); }, [page]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const label = status === 'ACCEPTED' ? 'acceptată' : status === 'REJECTED' ? 'refuzată' : 'anulată';
      toast.success(`Rezervarea a fost ${label}.`);
    } else {
      toast.error('Eroare la actualizarea rezervării.');
    }
    fetchBookings();
  };

  if (loading && bookings.length === 0) return <p className="text-gray-500">Se încarcă...</p>;

  const basePath = role === 'host' ? '/dashboard/host/bookings' : '/dashboard/guest/bookings';
  const pending = bookings.filter(b => b.status === 'PENDING');
  const others = role === 'host' ? bookings.filter(b => b.status !== 'PENDING') : bookings;

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        message={role === 'guest' ? 'Nu ai nicio rezervare încă.' : 'Nu ai nicio rezervare.'}
        action={role === 'guest' ? { label: 'Caută cazare', href: '/search' } : undefined}
      />
    );
  }

  return (
    <div>
      {/* Host pending section */}
      {role === 'host' && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-yellow-700">Cereri în așteptare ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(b => (
              <div key={b.id} className="card border-yellow-200 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.property.title}</h3>
                    <p className="text-sm text-gray-600">Oaspete: {b.guest.name} ({b.guest.email})</p>
                    <p className="text-sm text-gray-500">{formatDate(b.startDate)} – {formatDate(b.endDate)} · {formatRON(b.totalPrice)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(b.id, 'ACCEPTED')} className="btn-primary text-sm !py-1">Acceptă</button>
                    <button onClick={() => updateStatus(b.id, 'REJECTED')} className="btn-danger text-sm !py-1">Refuză</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === 'host' && <h2 className="text-lg font-semibold mb-3">Toate rezervările</h2>}

      <div className="space-y-4">
        {others.map(b => (
          <BookingCard
            key={b.id}
            booking={b}
            href={`${basePath}/${b.id}`}
            subtitle={role === 'host' ? `Oaspete: ${b.guest.name}` : undefined}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
