'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Resetare parolă</h1>
        <p className="text-sm text-gray-500 mb-6">Introdu adresa de email asociată contului tău și îți vom trimite un link de resetare.</p>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-green-700 font-medium mb-2">Email trimis!</p>
            <p className="text-sm text-gray-500 mb-4">Dacă adresa există în sistem, vei primi un email cu instrucțiuni de resetare a parolei.</p>
            <Link href="/auth/login" className="text-primary-600 hover:underline text-sm">Înapoi la autentificare</Link>
          </div>
        ) : (
          <>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="exemplu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Se trimite...' : 'Trimite link de resetare'}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4 text-center">
              <Link href="/auth/login" className="text-primary-600 hover:underline">Înapoi la autentificare</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
