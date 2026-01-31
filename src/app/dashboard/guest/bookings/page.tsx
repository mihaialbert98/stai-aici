'use client';

import { BookingList } from '@/components/BookingList';

export default function GuestBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rezervările mele</h1>
      <BookingList role="guest" />
    </div>
  );
}
