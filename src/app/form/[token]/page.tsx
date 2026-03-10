'use client';

import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Calendar } from 'lucide-react';
import { formT, setLangCookie } from '@/lib/i18n';
import { useLang, dispatchLangChange } from '@/lib/useLang';
import { LanguageToggle } from '@/components/LanguageToggle';
import { StayViaraLogo } from '@/components/StayViaraLogo';

interface Props {
  params: { token: string };
}

type FormData = {
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  citizenship: string;
  documentType: string;
  documentNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: string;
  gdprConsent: boolean;
};

export default function GuestFormPage({ params }: Props) {
  const lang = useLang();
  const t = formT[lang];

  const setLang = (l: typeof lang) => {
    setLangCookie(l);
    dispatchLangChange(l);
  };

  const [property, setProperty] = useState<{ title: string; city: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    lastName: '',
    firstName: '',
    dateOfBirth: '',
    citizenship: '',
    documentType: 'CI',
    documentNumber: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: '1',
    gdprConsent: false,
  });

  useEffect(() => {
    fetch(`/api/guest-form/${params.token}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => d && setProperty({ title: d.propertyTitle, city: d.propertyCity }));
  }, [params.token]);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.gdprConsent) {
      setError(t.gdprError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/guest-form/${params.token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, numberOfGuests: Number(form.numberOfGuests) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.genericError); return; }
      setConfirmationId(data.confirmationId);
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

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* Personal data */}
          <div>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionPersonal}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.lastName} *</label>
                <input
                  className="input"
                  required
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="Popescu"
                />
              </div>
              <div>
                <label className="label">{t.firstName} *</label>
                <input
                  className="input"
                  required
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  placeholder="Ion"
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.dateOfBirth} *</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="input pl-9"
                    required
                    value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">{t.citizenship} *</label>
                <input
                  className="input"
                  required
                  value={form.citizenship}
                  onChange={e => set('citizenship', e.target.value)}
                  placeholder={t.citizenshipPlaceholder}
                />
              </div>
            </div>
          </div>

          {/* Document */}
          <div>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionDocument}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.documentType} *</label>
                <select
                  className="input"
                  value={form.documentType}
                  onChange={e => set('documentType', e.target.value)}
                >
                  <option value="CI">{t.docCI}</option>
                  <option value="Pasaport">{t.docPassport}</option>
                  <option value="Permis de sedere">{t.docPermit}</option>
                </select>
              </div>
              <div>
                <label className="label">{t.documentNumber} *</label>
                <input
                  className="input"
                  required
                  value={form.documentNumber}
                  onChange={e => set('documentNumber', e.target.value)}
                  placeholder="AB123456"
                />
              </div>
            </div>
          </div>

          {/* Stay details */}
          <div>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">{t.sectionStay}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.checkIn} *</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="input pl-9"
                    required
                    value={form.checkInDate}
                    onChange={e => set('checkInDate', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">{t.checkOut} *</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="input pl-9"
                    required
                    value={form.checkOutDate}
                    onChange={e => set('checkOutDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className="label">{t.numberOfGuests} *</label>
              <input
                type="number"
                min={1}
                max={20}
                className="input w-32"
                required
                value={form.numberOfGuests}
                onChange={e => set('numberOfGuests', e.target.value)}
              />
            </div>
          </div>

          {/* GDPR */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 flex-shrink-0"
                checked={form.gdprConsent}
                onChange={e => set('gdprConsent', e.target.checked)}
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

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
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
