'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

const items = [
  { href: '/dashboard/guest/profile', label: 'Profilul meu' },
  { href: '/dashboard/guest/bookings', label: 'Rezervările mele' },
  { href: '/dashboard/guest/messages', label: 'Mesaje' },
  { href: '/dashboard/guest/settings', label: 'Setări' },
];

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout title="Contul meu" items={items}>{children}</DashboardLayout>;
}
