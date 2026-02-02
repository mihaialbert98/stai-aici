'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 text-center mt-20">Se încarcă...</p>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere');
      return;
    }
    if (password !== confirm) {
      setError('Parolele nu coincid');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    setDone(true);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="card w-full max-w-md text-center">
          <p className="text-red-600 mb-4">Link invalid. Solicită un nou link de resetare.</p>
          <Link href="/auth/forgot-password" className="text-primary-600 hover:underline">Resetare parolă</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Parolă nouă</h1>

        {done ? (
          <div className="text-center py-4">
            <p className="text-green-700 font-medium mb-2">Parola a fost resetată!</p>
            <p className="text-sm text-gray-500 mb-4">Te poți autentifica acum cu noua parolă.</p>
            <Link href="/auth/login" className="btn-primary inline-block">Autentificare</Link>
          </div>
        ) : (
          <>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Parolă nouă</label>
                <input type="password" className="input" placeholder="Minim 6 caractere" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">Confirmă parola</label>
                <input type="password" className="input" placeholder="Repetă parola" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Se salvează...' : 'Resetează parola'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
