'use client';

import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Calendar } from 'lucide-react';

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
      setError('Trebuie să accepți politica de confidențialitate pentru a continua.');
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
      if (!res.ok) { setError(data.error || 'Eroare la trimitere'); return; }
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
          <h1 className="text-xl font-semibold mb-2">Link invalid sau expirat</h1>
          <p className="text-gray-500">Contactează gazda pentru un link nou.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Datele au fost transmise cu succes</h1>
          <p className="text-gray-500 mb-4">
            Fișa de cazare pentru <strong>{property?.title}</strong> a fost înregistrată.
          </p>
          <p className="text-xs text-gray-400">ID confirmare: {confirmationId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <FileText size={36} className="mx-auto mb-3 text-primary-500" />
          <h1 className="text-2xl font-bold">Fișă de cazare</h1>
          {property && (
            <p className="text-gray-500 mt-1">
              {property.title} — {property.city}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* Personal data */}
          <div>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Date personale</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nume *</label>
                <input
                  className="input"
                  required
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="Popescu"
                />
              </div>
              <div>
                <label className="label">Prenume *</label>
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
                <label className="label">Data nașterii *</label>
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
                <label className="label">Cetățenie *</label>
                <input
                  className="input"
                  required
                  value={form.citizenship}
                  onChange={e => set('citizenship', e.target.value)}
                  placeholder="Română"
                />
              </div>
            </div>
          </div>

          {/* Document */}
          <div>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Document de identitate</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tip document *</label>
                <select
                  className="input"
                  value={form.documentType}
                  onChange={e => set('documentType', e.target.value)}
                >
                  <option value="CI">Carte de identitate</option>
                  <option value="Pasaport">Pașaport</option>
                  <option value="Permis de sedere">Permis de ședere</option>
                </select>
              </div>
              <div>
                <label className="label">Serie și număr *</label>
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
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Detalii ședere</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data check-in *</label>
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
                <label className="label">Data check-out *</label>
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
              <label className="label">Număr persoane cazate *</label>
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
                Am citit și sunt de acord cu{' '}
                <a href="/politica-confidentialitate" target="_blank" className="text-primary-600 hover:underline">
                  politica de confidențialitate
                </a>
                . Datele mele vor fi stocate conform legislației române privind cazarea (5 ani) și nu vor fi utilizate în alte scopuri.
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
            {submitting ? 'Se trimite…' : 'Trimite fișa de cazare'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{' '}
          <a href="/" className="hover:underline">
            Stai Aici
          </a>
        </p>
      </div>
    </div>
  );
}
