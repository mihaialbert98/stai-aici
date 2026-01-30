'use client';

import { useEffect, useState } from 'react';
import { Users, Home, CalendarDays } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState({ users: 0, properties: 0, bookings: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/properties').then(r => r.json()),
      fetch('/api/admin/bookings').then(r => r.json()),
    ]).then(([u, p, b]) => {
      setData({ users: u.total || 0, properties: p.total || 0, bookings: b.total || 0 });
    });
  }, []);

  const cards = [
    { label: 'Utilizatori', value: data.users, icon: Users },
    { label: 'Proprietăți', value: data.properties, icon: Home },
    { label: 'Rezervări', value: data.bookings, icon: CalendarDays },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card">
            <c.icon className="text-primary-600 mb-2" size={24} />
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
