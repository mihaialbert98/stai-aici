'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    const role = data.user.role;
    if (role === 'ADMIN') router.push('/dashboard/admin');
    else if (role === 'HOST') router.push('/dashboard/host');
    else router.push('/dashboard/guest/bookings');
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Intră în cont</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="exemplu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Parolă</label>
            <input type="password" className="input" placeholder="Introduceți parola" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Se încarcă...' : 'Autentificare'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Nu ai cont? <Link href="/auth/register" className="text-primary-600 hover:underline">Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
}
