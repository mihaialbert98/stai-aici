'use client';

import { useEffect, useState } from 'react';
import { ActiveBadge } from '@/components/ActiveBadge';
import { Pagination } from '@/components/Pagination';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    fetch(`/api/admin/users?${params}`).then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setTotalPages(d.pages || 1);
      setLoading(false);
    });
  };

  useEffect(() => { setPage(1); }, [search, roleFilter]);
  useEffect(() => { fetchUsers(page); }, [page, search, roleFilter]);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers(page);
  };

  const changeRole = async (id: string, newRole: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers(page);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Utilizatori</h1>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">Toate rolurile</option>
          <option value="GUEST">Oaspete</option>
          <option value="HOST">Gazdă</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading && users.length === 0 ? (
        <p className="text-gray-500">Se încarcă...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">Niciun utilizator găsit.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Nume</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Rol</th>
                <th className="pb-3 font-medium">Proprietăți</th>
                <th className="pb-3 font-medium">Rezervări</th>
                <th className="pb-3 font-medium">Înregistrat</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3">
                    {u.role === 'ADMIN' ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Admin</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
                      >
                        <option value="GUEST">Oaspete</option>
                        <option value="HOST">Gazdă</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3">{u._count.properties}</td>
                  <td className="py-3">{u._count.bookingsAsGuest}</td>
                  <td className="py-3 text-gray-500 text-xs">{format(new Date(u.createdAt), 'd MMM yyyy', { locale: ro })}</td>
                  <td className="py-3">
                    <ActiveBadge isActive={u.isActive} activeLabel="Activ" inactiveLabel="Inactiv" />
                  </td>
                  <td className="py-3">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleActive(u.id, u.isActive)}
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          u.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.isActive ? 'Dezactivează' : 'Activează'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
