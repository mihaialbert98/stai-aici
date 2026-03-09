import { getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Clock } from 'lucide-react';
import { cookies } from 'next/headers';
import type { Lang } from '@/lib/i18n';
import { dashboardT } from '@/lib/i18n';

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const lang = (cookies().get('nestly-lang')?.value || 'ro') as Lang;
  const t = dashboardT[lang].guestNav;

  const items = [
    { href: '/dashboard/guest/profile', label: t.profile },
    { href: '/dashboard/guest/bookings', label: t.myBookings },
    { href: '/dashboard/guest/messages', label: t.messages },
    { href: '/dashboard/guest/settings', label: t.settings },
  ];

  // Pure guest accounts see a "coming soon" screen — hosts who toggled to guest mode see the full dashboard
  if (session?.role === 'GUEST') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock size={28} />
          </div>
          <h1 className="text-2xl font-bold mb-3">{t.comingSoonTitle}</h1>
          <p className="text-gray-500 leading-relaxed">{t.comingSoonDesc}</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout title={t.title} items={items}>{children}</DashboardLayout>;
}
