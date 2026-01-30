'use client';

import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch('/api/admin/users').then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers();
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Utilizatori</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Nume</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Rol</th>
              <th className="pb-3 font-medium">Proprietăți</th>
              <th className="pb-3 font-medium">Rezervări</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-gray-600">{u.email}</td>
                <td className="py-3">{u.role}</td>
                <td className="py-3">{u._count.properties}</td>
                <td className="py-3">{u._count.bookingsAsGuest}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </td>
                <td className="py-3">
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => toggleActive(u.id, u.isActive)} className="text-sm text-primary-600 hover:underline">
                      {u.isActive ? 'Dezactivează' : 'Activează'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
