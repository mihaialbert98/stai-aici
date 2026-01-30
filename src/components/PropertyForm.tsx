'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialData?: any;
  propertyId?: string;
}

export function PropertyForm({ initialData, propertyId }: Props) {
  const router = useRouter();
  const [amenities, setAmenities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    city: initialData?.city || '',
    address: initialData?.address || '',
    pricePerNight: initialData?.pricePerNight || 0,
    maxGuests: initialData?.maxGuests || 1,
    checkInInfo: initialData?.checkInInfo || '',
    houseRules: initialData?.houseRules || '',
    localTips: initialData?.localTips || '',
    amenityIds: initialData?.amenities?.map((a: any) => a.amenityId || a.amenity?.id) || [] as string[],
    imageUrls: initialData?.images?.map((i: any) => i.url) || [''] as string[],
  });

  useEffect(() => {
    fetch('/api/amenities').then(r => r.json()).then(d => setAmenities(d.amenities || []));
  }, []);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleAmenity = (id: string) => {
    update('amenityIds', form.amenityIds.includes(id)
      ? form.amenityIds.filter((a: string) => a !== id)
      : [...form.amenityIds, id]);
  };

  const updateImage = (idx: number, url: string) => {
    const imgs = [...form.imageUrls];
    imgs[idx] = url;
    update('imageUrls', imgs);
  };

  const addImage = () => update('imageUrls', [...form.imageUrls, '']);
  const removeImage = (idx: number) => update('imageUrls', form.imageUrls.filter((_: any, i: number) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests),
      imageUrls: form.imageUrls.filter((u: string) => u.trim()),
    };

    const url = propertyId ? `/api/properties/${propertyId}` : '/api/properties';
    const method = propertyId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error); return; }
    router.push('/dashboard/host/properties');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="label">Titlu</label>
        <input className="input" placeholder="ex. Apartament modern în centrul Brașovului" value={form.title} onChange={e => update('title', e.target.value)} required />
      </div>

      <div>
        <label className="label">Descriere</label>
        <textarea className="input min-h-[120px]" placeholder="Descrieți proprietatea, ce o face specială, ce facilități oferă..." value={form.description} onChange={e => update('description', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Oraș</label>
          <input className="input" placeholder="ex. Brașov" value={form.city} onChange={e => update('city', e.target.value)} required />
        </div>
        <div>
          <label className="label">Adresă</label>
          <input className="input" placeholder="ex. Str. Republicii 42" value={form.address} onChange={e => update('address', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Preț per noapte (RON)</label>
          <input type="number" className="input" placeholder="ex. 350" value={form.pricePerNight} onChange={e => update('pricePerNight', e.target.value)} required min={1} />
        </div>
        <div>
          <label className="label">Nr. maxim oaspeți</label>
          <input type="number" className="input" placeholder="ex. 4" value={form.maxGuests} onChange={e => update('maxGuests', e.target.value)} required min={1} />
        </div>
      </div>

      <div>
        <label className="label">Instrucțiuni check-in</label>
        <textarea className="input" placeholder="ex. Check-in de la ora 15:00. Cheia se ridică de la recepție." value={form.checkInInfo} onChange={e => update('checkInInfo', e.target.value)} />
      </div>

      <div>
        <label className="label">Regulile casei</label>
        <textarea className="input" placeholder="ex. Nu se fumează. Liniște după ora 22:00." value={form.houseRules} onChange={e => update('houseRules', e.target.value)} />
      </div>

      <div>
        <label className="label">Recomandări locale</label>
        <textarea className="input" placeholder="ex. Restaurant recomandat: Caru' cu Bere (5 min)" value={form.localTips} onChange={e => update('localTips', e.target.value)} />
      </div>

      <div>
        <label className="label">Facilități</label>
        <div className="flex flex-wrap gap-2">
          {amenities.map(a => (
            <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)}
              className={`px-3 py-1 rounded-full text-sm border transition ${form.amenityIds.includes(a.id) ? 'bg-primary-100 border-primary-400 text-primary-700' : 'bg-white border-gray-300 text-gray-600'}`}>
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Imagini (URL-uri)</label>
        <div className="space-y-2">
          {form.imageUrls.map((url: string, i: number) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="https://..." value={url} onChange={e => updateImage(i, e.target.value)} />
              {form.imageUrls.length > 1 && (
                <button type="button" onClick={() => removeImage(i)} className="text-red-500 text-sm hover:underline">Șterge</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addImage} className="text-primary-600 text-sm hover:underline">+ Adaugă imagine</button>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Se salvează...' : propertyId ? 'Salvează modificările' : 'Creează proprietate'}
      </button>
    </form>
  );
}
