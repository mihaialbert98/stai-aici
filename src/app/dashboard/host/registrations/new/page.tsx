'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';
import { PenLine, Trash2, CheckCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface Property {
  id: string;
  title: string;
}

export default function NewRegistrationPage() {
  const router = useRouter();
  const lang = useLang();
  const t = dashboardT[lang].guestForms;

  // Signature state
  const [hasSignature, setHasSignature] = useState<boolean | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [showSigPad, setShowSigPad] = useState(false);
  const [savingSig, setSavingSig] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  // Form state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [totalGuests, setTotalGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load signature status + properties
  useEffect(() => {
    fetch('/api/host/receptionist-signature')
      .then(r => r.json())
      .then(d => {
        setHasSignature(d.hasSignature);
        if (d.hasSignature) setSigPreview(d.signature);
        if (!d.hasSignature) setShowSigPad(true);
      });

    fetch('/api/host/properties')
      .then(r => r.json())
      .then(d => {
        setProperties(d.properties || []);
        if (d.properties?.length > 0) setPropertyId(d.properties[0].id);
      });
  }, []);

  // Init signature pad when shown
  const initPad = useCallback(() => {
    if (!canvasRef.current) return;
    if (padRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' });
  }, []);

  useEffect(() => {
    if (showSigPad) {
      // Small delay to ensure canvas is rendered
      setTimeout(initPad, 50);
    } else {
      padRef.current = null;
    }
  }, [showSigPad, initPad]);

  const saveSignature = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast.error(t.sigRequired);
      return;
    }
    const sig = padRef.current.toDataURL('image/png');
    setSavingSig(true);
    try {
      const res = await fetch('/api/host/receptionist-signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: sig }),
      });
      if (!res.ok) { toast.error(t.sigSaveError); return; }
      setSigPreview(sig);
      setHasSignature(true);
      setShowSigPad(false);
      padRef.current = null;
      toast.success(t.sigSaved);
    } finally {
      setSavingSig(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature) { toast.error(t.sigFirst); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/host/form-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, totalGuests }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || t.createError); return; }
      setCreatedToken(data.formRequest.publicToken);
    } finally {
      setSubmitting(false);
    }
  };

  const publicUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${token}`;

  const copyLink = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(publicUrl(createdToken));
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success screen
  if (createdToken) {
    return (
      <div className="max-w-xl">
        <div className="card text-center py-10">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold mb-2">{t.formCreated}</h2>
          <p className="text-gray-500 mb-6 text-sm">{t.formCreatedDesc}</p>
          <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm break-all mb-4">
            {publicUrl(createdToken)}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={copyLink} className="btn-primary flex items-center gap-1.5">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t.copiedBtn : t.copyLink}
            </button>
            <a
              href={publicUrl(createdToken)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-1.5"
            >
              <ExternalLink size={16} /> {t.open}
            </a>
          </div>
          <button
            onClick={() => router.push('/dashboard/host/registrations')}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            {t.backToList}
          </button>
        </div>
      </div>
    );
  }

  if (hasSignature === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t.newFormTitle}</h1>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">{t.newFormTitle}</h1>

      {/* Section A — Receptionist signature */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t.sigTitle}</h2>
          {hasSignature && !showSigPad && (
            <button
              onClick={() => { setShowSigPad(true); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {t.change}
            </button>
          )}
        </div>

        {hasSignature && !showSigPad ? (
          <div className="flex items-center gap-3">
            <img
              src={sigPreview!}
              alt={t.sigTitle}
              className="h-12 border border-gray-200 rounded-lg bg-white px-2"
            />
            <span className="text-sm text-green-600 font-medium">{t.sigSavedCheck}</span>
          </div>
        ) : (
          <div>
            {hasSignature && (
              <p className="text-sm text-gray-500 mb-3">{t.sigReplaceHint}</p>
            )}
            {!hasSignature && (
              <p className="text-sm text-gray-500 mb-3">{t.sigFirstHint}</p>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white mb-3">
              <canvas
                ref={canvasRef}
                className="w-full h-28 cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={12} /> {t.clear}
              </button>
              <button
                type="button"
                onClick={saveSignature}
                disabled={savingSig}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <PenLine size={14} /> {savingSig ? t.savingSig : t.saveSig}
              </button>
              {hasSignature && showSigPad && (
                <button
                  type="button"
                  onClick={() => { setShowSigPad(false); padRef.current = null; }}
                  className="btn-secondary text-sm"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section B — Form request */}
      <form onSubmit={handleSubmit} className={`card space-y-4 ${!hasSignature ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="font-semibold">{t.formDetails}</h2>

        {properties.length === 0 ? (
          <p className="text-sm text-gray-500">{t.noActiveProperties} <a href="/dashboard/host/properties/new" className="text-primary-600 hover:underline">{t.addOne}</a>.</p>
        ) : (
          <>
            <div>
              <label className="label">{t.propertyLabel}</label>
              <select className="input" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t.guestCountLabel}</label>
              <input
                type="number"
                className="input w-24"
                min={1}
                max={20}
                required
                value={totalGuests}
                onChange={e => setTotalGuests(Number(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !hasSignature}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? t.creating : t.createAndGetLink}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
