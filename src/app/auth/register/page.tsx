'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GUEST' | 'HOST'>('GUEST');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setRegisteredEmail(data.email || email);
    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="card w-full max-w-md text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-xl font-bold mb-2">Cont creat cu succes!</h1>
          <p className="text-gray-600 text-sm mb-2">
            Am trimis un email de verificare la <strong>{registeredEmail}</strong>.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            <Mail size={12} className="inline mr-1" />
            Verifică și folderul spam dacă nu găsești emailul.
          </p>
          <Link href="/auth/login" className="btn-primary inline-block px-6 py-2.5">
            Intră în cont
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Creează cont</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nume complet</label>
            <input className="input" placeholder="Ion Popescu" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="exemplu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Parolă</label>
            <input type="password" className="input" placeholder="Minim 6 caractere" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="label">Tip cont</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" value="GUEST" checked={role === 'GUEST'} onChange={() => setRole('GUEST')} />
                <span className="text-sm">Oaspete</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" value="HOST" checked={role === 'HOST'} onChange={() => setRole('HOST')} />
                <span className="text-sm">Gazdă</span>
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Se încarcă...' : 'Înregistrare'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Ai deja cont? <Link href="/auth/login" className="text-primary-600 hover:underline">Intră în cont</Link>
        </p>
      </div>
    </div>
  );
}
