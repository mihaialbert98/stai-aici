'use client';

import { BookingList } from '@/components/BookingList';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function HostBookingsPage() {
  const lang = useLang();
  const t = dashboardT[lang].bookings;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      <BookingList role="host" />
    </div>
  );
}
