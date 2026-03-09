'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  value: string;
  className?: string;
}

export function CopyButton({ value, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition ${
        copied
          ? 'border-green-200 bg-green-50 text-green-600'
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      } ${className}`}
      title="Copiază"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copiat!' : 'Copiază'}
    </button>
  );
}
