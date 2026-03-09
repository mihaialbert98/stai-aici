import { getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Clock } from 'lucide-react';

const items = [
  { href: '/dashboard/guest/profile', label: 'Profilul meu' },
  { href: '/dashboard/guest/bookings', label: 'Rezervările mele' },
  { href: '/dashboard/guest/messages', label: 'Mesaje' },
  { href: '/dashboard/guest/settings', label: 'Setări' },
];

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Pure guest accounts see a "coming soon" screen — hosts who toggled to guest mode see the full dashboard
  if (session?.role === 'GUEST') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock size={28} />
          </div>
          <h1 className="text-2xl font-bold mb-3">În curând</h1>
          <p className="text-gray-500 leading-relaxed">
            Nestly este momentan o platformă pentru gazde. Funcționalitățile pentru oaspeți —
            căutare, rezervări și recenzii — vor fi disponibile în curând.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout title="Contul meu" items={items}>{children}</DashboardLayout>;
}
