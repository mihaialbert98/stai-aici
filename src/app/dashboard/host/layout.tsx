'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const lang = useLang();
  const t = dashboardT[lang];

  const items = [
    { href: '/dashboard/host', label: t.nav.overview },
    { href: '/dashboard/host/properties', label: t.nav.properties },
    { href: '/dashboard/host/calendar', label: t.nav.calendar },
    { href: '/dashboard/host/checkin-links', label: t.nav.checkinLinks },
    { href: '/dashboard/host/registrations', label: t.nav.guestForms },
    { href: '/dashboard/host/settings', label: t.nav.settings },
  ];

  return <DashboardLayout title={t.nav.title} items={items}>{children}</DashboardLayout>;
}
