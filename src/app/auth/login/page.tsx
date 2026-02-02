'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResent(false);
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(data.email || email);
      }
      setError(data.error);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  const handleResend = async () => {
    setResending(true);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verificationEmail }),
    });
    setResending(false);
    setResent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Intră în cont</h1>
        {error && (
          <div className="mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            {needsVerification && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                {resent ? (
                  <p className="text-sm text-green-600">Email de verificare retrimis la {verificationEmail}!</p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Mail size={13} /> {resending ? 'Se trimite...' : 'Retrimite email de verificare'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
