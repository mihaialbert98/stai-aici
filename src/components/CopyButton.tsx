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
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${
        copied
          ? 'text-emerald-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
      } ${className}`}
      title="Copiază"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copiat!' : 'Copiază'}
    </button>
  );
}
