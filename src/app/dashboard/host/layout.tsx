'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

const items = [
  { href: '/dashboard/host', label: 'Panou principal' },
  { href: '/dashboard/host/properties', label: 'Proprietăți' },
  { href: '/dashboard/host/bookings', label: 'Rezervări' },
  { href: '/dashboard/host/calendar', label: 'Calendar' },
  { href: '/dashboard/host/messages', label: 'Mesaje' },
  { href: '/dashboard/host/settings', label: 'Setări' },
];

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout title="Gazdă" items={items}>{children}</DashboardLayout>;
}
