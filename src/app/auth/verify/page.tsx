'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link de verificare invalid.');
      return;
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setMessage(data.error);
        } else {
          setStatus('success');
          setMessage(data.message);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Eroare la verificare. Încearcă din nou.');
      });
  }, [token]);

  const handleResend = async () => {
    const email = prompt('Introdu adresa de email:');
    if (!email) return;
    setResending(true);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 text-primary-600 animate-spin" />
            <h1 className="text-xl font-bold mb-2">Se verifică emailul...</h1>
            <p className="text-gray-500 text-sm">Te rugăm să aștepți.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h1 className="text-xl font-bold mb-2">Email verificat!</h1>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <Link href="/auth/login" className="btn-primary inline-block px-6 py-2.5">
              Intră în cont
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold mb-2">Verificare eșuată</h1>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            {resent ? (
              <p className="text-sm text-green-600">Email de verificare retrimis!</p>
            ) : (
              <button onClick={handleResend} disabled={resending} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 mx-auto">
                <Mail size={14} /> {resending ? 'Se trimite...' : 'Retrimite email de verificare'}
              </button>
            )}
            <Link href="/auth/login" className="text-sm text-primary-600 hover:underline mt-4 block">
              Înapoi la autentificare
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
