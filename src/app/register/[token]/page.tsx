'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { CheckCircle, FileText, PenLine, Trash2 } from 'lucide-react';

interface FormContext {
  status: 'pending' | 'complete';
  propertyTitle?: string;
  propertyCity?: string;
  arrivalDate?: string | null;
  departureDate?: string | null;
  guestIndex?: number;
  totalGuests?: number;
  completedCount?: number;
}

interface FormState {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  city: string;
  street: string;
  streetNumber: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  purposeOfTravel: string;
  idType: string;
  idSeries: string;
  idNumber: string;
}

const EMPTY_FORM: FormState = {
  fullName: '', dateOfBirth: '', placeOfBirth: '', nationality: '',
  city: '', street: '', streetNumber: '', country: '',
  arrivalDate: '', departureDate: '',
  purposeOfTravel: 'Turism', idType: 'Carte de identitate', idSeries: '', idNumber: '',
};

export default function RegisterPage({ params }: { params: { token: string } }) {
  const [ctx, setCtx] = useState<FormContext | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const fetchCtx = useCallback(() => {
    fetch(`/api/registration/${params.token}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => d && setCtx(d));
  }, [params.token]);

  useEffect(() => { fetchCtx(); }, [fetchCtx]);

  // Init signature pad after ctx loads
  useEffect(() => {
    if (!canvasRef.current || ctx?.status !== 'pending') return;
    if (padRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    padRef.current = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' });
  }, [ctx]);

  // Reset form on new guest — pre-fill dates from context (carried over from guest 1)
  useEffect(() => {
    if (!ctx) return;
    padRef.current?.clear();
    setForm({
      ...EMPTY_FORM,
      arrivalDate: ctx.arrivalDate || '',
      departureDate: ctx.departureDate || '',
    });
    setError('');
  }, [ctx?.guestIndex]);

  const set = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Semnătura este obligatorie. Te rugăm să semnezi în câmpul de mai jos.');
      return;
    }

    const signatureImage = padRef.current.toDataURL('image/png');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/registration/${params.token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signatureImage }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Eroare la trimitere'); return; }

      if (data.hasMore) {
        fetchCtx();
      } else {
        setCtx({ status: 'complete', totalGuests: data.totalGuests });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-semibold mb-2">Link invalid sau expirat</h1>
        <p className="text-gray-500">Contactează gazda pentru ajutor.</p>
      </div>
    </div>
  );

  if (!ctx) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-xl px-4">
        <div className="bg-gray-200 h-8 w-1/2 rounded mx-auto" />
        <div className="bg-white rounded-2xl p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-gray-100 h-10 rounded" />)}
        </div>
      </div>
    </div>
  );

  if (ctx.status === 'complete') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <CheckCircle size={52} className="mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Înregistrare completă</h1>
        <p className="text-gray-500">
          Toate fișele de cazare ({ctx.totalGuests}) au fost completate cu succes.
        </p>
        <p className="text-gray-400 text-sm mt-3">Mulțumim și vă dorim o ședere plăcută!</p>
      </div>
    </div>
  );

  const { guestIndex = 1, totalGuests = 1 } = ctx;
  const progress = Math.round(((guestIndex - 1) / totalGuests) * 100);
  const isFirstGuest = guestIndex === 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <FileText size={36} className="mx-auto mb-3 text-primary-500" />
          <h1 className="text-2xl font-bold">Fișă de cazare</h1>
          <p className="text-gray-500 mt-1">{ctx.propertyTitle} — {ctx.propertyCity}</p>
        </div>

        {/* Progress */}
        {totalGuests > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>Oaspete {guestIndex} din {totalGuests}</span>
              <span>{progress}% completat</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">

          {/* Stay details — first so guests see dates before filling personal info */}
          <section>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-3">Detalii ședere</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Data sosirii *</label>
                <input
                  type="date"
                  className={`input ${!isFirstGuest ? 'bg-blue-50' : ''}`}
                  required
                  value={form.arrivalDate}
                  onChange={e => set('arrivalDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Data plecării *</label>
                <input
                  type="date"
                  className={`input ${!isFirstGuest ? 'bg-blue-50' : ''}`}
                  required
                  value={form.departureDate}
                  onChange={e => set('departureDate', e.target.value)}
                  min={form.arrivalDate}
                />
              </div>
            </div>
            {!isFirstGuest && (
              <p className="text-xs text-blue-500">Datele sunt preluate de la primul oaspete. Le poți modifica dacă e necesar.</p>
            )}
            <div>
              <label className="label">Scopul călătoriei *</label>
              <select className="input" value={form.purposeOfTravel}
                onChange={e => set('purposeOfTravel', e.target.value)}>
                <option>Turism</option>
                <option>Afaceri</option>
                <option>Alt motiv</option>
              </select>
            </div>
          </section>

          {/* Personal data */}
          <section>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-3">Date personale</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nume complet *</label>
                <input className="input" required value={form.fullName}
                  onChange={e => set('fullName', e.target.value)} placeholder="Popescu Ion" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Data nașterii *</label>
                  <input type="date" className="input" required value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)} />
                </div>
                <div>
                  <label className="label">Locul nașterii *</label>
                  <input className="input" required value={form.placeOfBirth}
                    onChange={e => set('placeOfBirth', e.target.value)} placeholder="București" />
                </div>
              </div>
              <div>
                <label className="label">Cetățenie *</label>
                <input className="input" required value={form.nationality}
                  onChange={e => set('nationality', e.target.value)} placeholder="Română" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-3">Adresă domiciliu</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <div>
                  <label className="label">Stradă *</label>
                  <input className="input" required value={form.street}
                    onChange={e => set('street', e.target.value)} placeholder="Str. Victoriei" />
                </div>
                <div>
                  <label className="label">Nr. *</label>
                  <input className="input" required value={form.streetNumber}
                    onChange={e => set('streetNumber', e.target.value)} placeholder="12" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Oraș *</label>
                  <input className="input" required value={form.city}
                    onChange={e => set('city', e.target.value)} placeholder="București" />
                </div>
                <div>
                  <label className="label">Țară *</label>
                  <input className="input" required value={form.country}
                    onChange={e => set('country', e.target.value)} placeholder="România" />
                </div>
              </div>
            </div>
          </section>

          {/* Document */}
          <section>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-3">Act de identitate</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Tip act *</label>
                <select className="input" value={form.idType}
                  onChange={e => set('idType', e.target.value)}>
                  <option>Carte de identitate</option>
                  <option>Pașaport</option>
                  <option>Permis de ședere</option>
                  <option>Alt document</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Serie *</label>
                  <input className="input" required value={form.idSeries}
                    onChange={e => set('idSeries', e.target.value)} placeholder="AB" />
                </div>
                <div>
                  <label className="label">Număr *</label>
                  <input className="input" required value={form.idNumber}
                    onChange={e => set('idNumber', e.target.value)} placeholder="123456" />
                </div>
              </div>
            </div>
          </section>

          {/* Signature */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                <PenLine size={14} /> Semnătură *
              </h2>
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={12} /> Șterge
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-32 cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Semnează în câmpul de mai sus folosind mouse-ul sau degetul</p>
          </section>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Se procesează…' : `Trimite fișa${totalGuests > 1 ? ` (Oaspete ${guestIndex}/${totalGuests})` : ''}`}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <a href="/" className="hover:underline">Stai Aici</a>
        </p>
      </div>
    </div>
  );
}
