'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, CheckCircle, Calendar, X } from 'lucide-react';
import { formT, setLangCookie } from '@/lib/i18n';
import { useLang, dispatchLangChange } from '@/lib/useLang';
import { LanguageToggle } from '@/components/LanguageToggle';
import { StayViaraLogo } from '@/components/StayViaraLogo';

interface Props {
  params: { token: string };
}

type SingleGuest = {
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  citizenship: string;
  city: string;
  street: string;
  streetNumber: string;
  country: string;
  purposeOfTravel: string;
  documentType: string;
  idSeries: string;
  idNumber: string;
  touristSignature: string;
  checkInDate: string;
  checkOutDate: string;
};

const emptyGuest = (): SingleGuest => ({
  lastName: '',
  firstName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  citizenship: '',
  city: '',
  street: '',
  streetNumber: '',
  country: '',
  purposeOfTravel: '',
  documentType: 'CI',
  idSeries: '',
  idNumber: '',
  touristSignature: '',
  checkInDate: '',
  checkOutDate: '',
});

export default function GuestFormPage({ params }: Props) {
  const lang = useLang();
  const t = formT[lang];

  const setLang = (l: typeof lang) => {
    setLangCookie(l);
    dispatchLangChange(l);
  };

  const [property, setProperty] = useState<{ title: string; city: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [maxGuestCount, setMaxGuestCount] = useState(1);

  const [guests, setGuests] = useState<SingleGuest[]>([emptyGuest()]);
  const [gdprConsent, setGdprConsent] = useState(false);

  useEffect(() => {
    fetch(`/api/guest-form/${params.token}`)
      .then(r => {
        if (r.status === 403) { setInactive(true); return null; }
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setProperty({ title: d.propertyTitle, city: d.propertyCity });
        setMaxGuestCount(d.activeGuestCount ?? 1);
      });
  }, [params.token]);

  const handleGuestCountChange = (n: number) => {
    setGuests(prev =>
      n > prev.length
        ? [...prev, ...Array.from({ length: n - prev.length }, () => emptyGuest())]
        : prev.slice(0, n)
    );
  };

  const setGuest = (index: number, field: keyof SingleGuest, value: string) =>
    setGuests(prev => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!gdprConsent) {
      setError(t.gdprError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = guests.map(g => ({
        lastName:         g.lastName,
        firstName:        g.firstName,
        dateOfBirth:      g.dateOfBirth,
        placeOfBirth:     g.placeOfBirth,
        citizenship:      g.citizenship,
        city:             g.city,
        street:           g.street,
        streetNumber:     g.streetNumber,
        country:          g.country,
        purposeOfTravel:  g.purposeOfTravel,
        documentType:     g.documentType,
        idSeries:         g.idSeries,
        idNumber:         g.idNumber,
        touristSignature: g.touristSignature,
        checkInDate:      guests[0].checkInDate,
        checkOutDate:     guests[0].checkOutDate,
        numberOfGuests:   guests.length,
        gdprConsent:      true as const,
      }));
      const res = await fetch(`/api/guest-form/${params.token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data: { error?: string; confirmationIds?: string[] } = {};
      try {
        data = await res.json();
      } catch {
        setError(t.genericError);
        return;
      }
      if (!res.ok) { setError(data.error || t.genericError); return; }
      setConfirmationId(data.confirmationIds?.[0] ?? '');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-semibold mb-2">{t.notFound}</h1>
          <p className="text-gray-500">{t.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  if (inactive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-semibold mb-2">{t.inactive}</h1>
          <p className="text-gray-500">{t.inactiveDesc}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">{t.successTitle}</h1>
          <p className="text-gray-500 mb-4">{t.successDesc(property?.title ?? '')}</p>
          <p className="text-xs text-gray-400">{t.confirmationId}: {confirmationId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-end mb-3">
            <LanguageToggle current={lang} onChange={setLang} />
          </div>
          <FileText size={36} className="mx-auto mb-3 text-primary-500" />
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {property && (
            <p className="text-gray-500 mt-1">
              {property.title} — {property.city}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest count selector — only when property has capacity > 1 */}
          {maxGuestCount > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <label className="label">{t.numberOfGuests}</label>
              <select
                className="input mt-1 w-32"
                value={guests.length}
                onChange={e => handleGuestCountChange(Number(e.target.value))}
              >
                {Array.from({ length: maxGuestCount }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {guests.map((g, i) => (
            <GuestPanel
              key={i}
              index={i}
              data={g}
              onChange={(field, value) => setGuest(i, field, value)}
              onSignatureChange={(sig) => setGuest(i, 'touristSignature', sig)}
              t={t}
              lang={lang}
            />
          ))}

          {/* GDPR — shared, at bottom */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 flex-shrink-0"
                checked={gdprConsent}
                onChange={e => setGdprConsent(e.target.checked)}
              />
              <span className="text-sm text-gray-600">
                {t.gdprText}{' '}
                <a href="/politica-confidentialitate" target="_blank" className="text-primary-600 hover:underline">
                  {t.gdprLink}
                </a>
                {t.gdprDesc}
              </span>
            </label>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? t.submitting : t.submit}
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <StayViaraLogo className="opacity-30 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

function minCheckOut(checkInValue: string): string {
  const base = checkInValue ? new Date(checkInValue) : new Date();
  base.setDate(base.getDate() + 1);
  return base.toISOString().split('T')[0];
}

function GuestPanel({
  index,
  data,
  onChange,
  onSignatureChange,
  t,
  lang,
}: {
  index: number;
  data: SingleGuest;
  onChange: (field: keyof SingleGuest, value: string) => void;
  onSignatureChange: (sig: string) => void;
  t: typeof formT['ro'] | typeof formT['en'];
  lang: 'ro' | 'en';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="font-semibold text-base text-gray-700">{t.guestPanel(index + 1)}</h2>

      {/* Personal data */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionPersonal}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t.lastName} *</label>
            <input className="input" required value={data.lastName} onChange={e => onChange('lastName', e.target.value)} placeholder="Popescu" />
          </div>
          <div>
            <label className="label">{t.firstName} *</label>
            <input className="input" required value={data.firstName} onChange={e => onChange('firstName', e.target.value)} placeholder="Ion" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t.dateOfBirth} *</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="date" className="input pl-9" required value={data.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t.citizenship} *</label>
            <input className="input" required value={data.citizenship} onChange={e => onChange('citizenship', e.target.value)} placeholder={t.citizenshipPlaceholder} />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">{t.placeOfBirth} *</label>
          <input className="input" required value={data.placeOfBirth} onChange={e => onChange('placeOfBirth', e.target.value)} placeholder={t.placeOfBirthPlaceholder} />
        </div>
      </div>

      {/* Home address */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionAddress}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t.city} *</label>
            <input className="input" required value={data.city} onChange={e => onChange('city', e.target.value)} placeholder={t.cityPlaceholder} />
          </div>
          <div>
            <label className="label">{t.country} *</label>
            <input className="input" required value={data.country} onChange={e => onChange('country', e.target.value)} placeholder={t.countryPlaceholder} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">{t.street} *</label>
            <input className="input" required value={data.street} onChange={e => onChange('street', e.target.value)} placeholder={t.streetPlaceholder} />
          </div>
          <div>
            <label className="label">{t.streetNumber} *</label>
            <input className="input" required value={data.streetNumber} onChange={e => onChange('streetNumber', e.target.value)} placeholder="10" />
          </div>
        </div>
      </div>

      {/* Identity document */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionDocument}</h3>
        <div>
          <label className="label">{t.documentType} *</label>
          <select className="input" value={data.documentType} onChange={e => onChange('documentType', e.target.value)}>
            <option value="CI">{t.docCI}</option>
            <option value="Pasaport">{t.docPassport}</option>
            <option value="Permis de sedere">{t.docPermit}</option>
          </select>
        </div>
        <div className="mt-3 flex gap-3">
          {data.documentType === 'CI' && (
            <div className="w-28 shrink-0">
              <label className="label">{t.idSeries} ({lang === 'ro' ? 'opțional' : 'optional'})</label>
              <input className="input" value={data.idSeries} onChange={e => onChange('idSeries', e.target.value)} placeholder="AB" />
            </div>
          )}
          <div className="flex-1">
            <label className="label">{t.idNumber} *</label>
            <input className="input" required value={data.idNumber} onChange={e => onChange('idNumber', e.target.value)} placeholder="123456" />
          </div>
        </div>
      </div>

      {/* Purpose of visit — only on first panel */}
      {index === 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionPurpose}</h3>
          <div>
            <label className="label">{t.purposeOfTravel} *</label>
            <select className="input" required value={data.purposeOfTravel} onChange={e => onChange('purposeOfTravel', e.target.value)}>
              <option value="" disabled>{t.purposeOfTravel}</option>
              <option value={t.purposeLeisure}>{t.purposeLeisure}</option>
              <option value={t.purposeBusiness}>{t.purposeBusiness}</option>
              <option value={t.purposeTransit}>{t.purposeTransit}</option>
              <option value={t.purposeStudy}>{t.purposeStudy}</option>
              <option value={t.purposeOther}>{t.purposeOther}</option>
            </select>
          </div>
        </div>
      )}

      {/* Stay details — only on first panel */}
      {index === 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionStay}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.checkIn} *</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" className="input pl-9" required value={data.checkInDate} min={new Date().toISOString().split('T')[0]} onChange={e => {
                  onChange('checkInDate', e.target.value);
                  if (data.checkOutDate && data.checkOutDate <= e.target.value) {
                    onChange('checkOutDate', '');
                  }
                }} />
              </div>
            </div>
            <div>
              <label className="label">{t.checkOut} *</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" className="input pl-9" required value={data.checkOutDate} min={minCheckOut(data.checkInDate)} onChange={e => onChange('checkOutDate', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tourist signature */}
      <div>
        <h3 className="font-semibold mb-1 text-sm uppercase tracking-wide text-gray-400">{t.sectionSignature}</h3>
        <p className="text-xs text-gray-400 mb-2">{t.signatureHint}</p>
        <div
          className="relative border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-white"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full cursor-crosshair block"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <X size={14} /> {t.signatureClear}
          </button>
        </div>
      </div>
    </div>
  );
}
