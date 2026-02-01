'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Folosim cookie-uri esentiale pentru functionarea site-ului si autentificare.
          Detalii in <Link href="/cookies" className="text-primary-600 underline">politica de cookies</Link>.
        </p>
        <button onClick={accept} className="btn-primary text-sm px-6 py-2 flex-shrink-0">
          Accept
        </button>
      </div>
    </div>
  );
}
