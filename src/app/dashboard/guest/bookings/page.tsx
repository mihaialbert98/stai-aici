'use client';

import { BookingList } from '@/components/BookingList';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function GuestBookingsPage() {
  const lang = useLang();
  const t = dashboardT[lang].bookings;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.myBookings}</h1>
      <BookingList role="guest" />
    </div>
  );
}
