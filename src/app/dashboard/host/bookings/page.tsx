'use client';

import { BookingList } from '@/components/BookingList';

export default function HostBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rezervări</h1>
      <BookingList role="host" />
    </div>
  );
}
