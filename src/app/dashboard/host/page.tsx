'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRON } from '@/lib/utils';
import { CalendarDays, Moon, DollarSign, Clock } from 'lucide-react';

export default function HostDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/host/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <p className="text-gray-500">Se încarcă...</p>;

  const cards = [
    { label: 'Rezervări luna aceasta', value: stats.totalBookings, icon: CalendarDays, color: 'text-blue-600' },
    { label: 'Nopți rezervate', value: stats.totalNights, icon: Moon, color: 'text-purple-600' },
    { label: 'Venit estimat', value: formatRON(stats.totalRevenue), icon: DollarSign, color: 'text-green-600' },
    { label: 'Cereri în așteptare', value: stats.pendingCount, icon: Clock, color: 'text-yellow-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panou principal</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="card">
            <c.icon className={`${c.color} mb-2`} size={24} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>
      {stats.pendingCount > 0 && (
        <Link href="/dashboard/host/bookings" className="btn-primary">
          Vezi cererile în așteptare ({stats.pendingCount})
        </Link>
      )}
    </div>
  );
}
