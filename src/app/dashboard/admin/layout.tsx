'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

const items = [
  { href: '/dashboard/admin', label: 'Panou principal' },
  { href: '/dashboard/admin/users', label: 'Utilizatori' },
  { href: '/dashboard/admin/properties', label: 'Proprietăți' },
  { href: '/dashboard/admin/bookings', label: 'Rezervări' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout title="Admin" items={items}>{children}</DashboardLayout>;
}
