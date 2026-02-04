'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Calendar, Loader2 } from 'lucide-react';
import { formatRON } from '@/lib/utils';

interface PeriodPricing {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
}

interface Props {
  propertyId: string;
  initialPricings?: PeriodPricing[];
  defaultPrice: number;
}

export function PeriodPricingManager({ propertyId, initialPricings = [], defaultPrice }: Props) {
  const [pricings, setPricings] = useState<PeriodPricing[]>(initialPricings);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    pricePerNight: defaultPrice,
  });

  const resetForm = () => {
    setForm({ name: '', startDate: '', endDate: '', pricePerNight: defaultPrice });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const openEditForm = (pricing: PeriodPricing) => {
    setForm({
      name: pricing.name,
      startDate: pricing.startDate.split('T')[0],
      endDate: pricing.endDate.split('T')[0],
      pricePerNight: pricing.pricePerNight,
    });
    setEditingId(pricing.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      id: editingId,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: Number(form.pricePerNight),
    };

    try {
      const res = await fetch(`/api/properties/${propertyId}/period-pricing`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Eroare la salvare');
        setSaving(false);
        return;
      }

      if (editingId) {
        setPricings(pricings.map(p => p.id === editingId ? data.periodPricing : p));
      } else {
        setPricings([...pricings, data.periodPricing]);
      }

      resetForm();
    } catch {
      setError('Eroare la salvare');
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această perioadă de preț?')) return;

    try {
      const res = await fetch(`/api/properties/${propertyId}/period-pricing`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setPricings(pricings.filter(p => p.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const formatPeriodDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM yyyy', { locale: ro });
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">Prețuri pe perioade</h3>
          <p className="text-sm text-gray-500">Setează prețuri diferite pentru anumite perioade (sărbători, sezon)</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Adaugă perioadă
          </button>
        )}
      </div>

      {/* Existing periods list */}
      {pricings.length > 0 && (
        <div className="space-y-2 mb-4">
          {pricings.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPeriodDate(p.startDate)} — {formatPeriodDate(p.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-primary-600">{formatRON(p.pricePerNight)}/noapte</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEditForm(p)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">
              {editingId ? 'Editează perioada' : 'Adaugă perioadă nouă'}
            </h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="label">Nume perioadă</label>
            <input
              type="text"
              className="input"
              placeholder="ex. Sărbători de iarnă"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data început</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Data sfârșit</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                min={form.startDate}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Preț per noapte (RON)</label>
            <input
              type="number"
              className="input"
              placeholder="ex. 450"
              value={form.pricePerNight}
              onChange={e => setForm({ ...form, pricePerNight: Number(e.target.value) })}
              min={1}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Prețul standard: {formatRON(defaultPrice)}/noapte
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary text-sm" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Se salvează...
                </>
              ) : editingId ? 'Salvează' : 'Adaugă'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">
              Anulează
            </button>
          </div>
        </form>
      )}

      {pricings.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">
          Nu ai setat prețuri speciale pe perioade
        </p>
      )}
    </div>
  );
}
