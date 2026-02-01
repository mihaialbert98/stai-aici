'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, GripVertical, ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  initialData?: any;
  propertyId?: string;
}

export function PropertyForm({ initialData, propertyId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    imageUrls: initialData?.images?.map((i: any) => i.url) || [] as string[],
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

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    fileArray.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setUploading(false);
        return;
      }

      const newUrls = data.images.map((img: { url: string }) => img.url);
      update('imageUrls', [...form.imageUrls, ...newUrls]);
    } catch {
      setError('Eroare la încărcarea imaginilor');
    }
    setUploading(false);
  }, [form.imageUrls]);

  const removeImage = async (idx: number) => {
    const url = form.imageUrls[idx];
    // Delete from blob storage (fire and forget for URLs that are blob URLs)
    if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
      fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    }
    update('imageUrls', form.imageUrls.filter((_: string, i: number) => i !== idx));
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= form.imageUrls.length) return;
    const imgs = [...form.imageUrls];
    [imgs[idx], imgs[newIdx]] = [imgs[newIdx], imgs[idx]];
    update('imageUrls', imgs);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

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

      {/* Image Upload Section */}
      <div>
        <label className="label">Imagini</label>

        {/* Image previews grid */}
        {form.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {form.imageUrls.map((url: string, i: number) => (
              <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3]">
                <img src={url} alt={`Imagine ${i + 1}`} className="w-full h-full object-cover" />

                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-start justify-between p-1.5 opacity-0 group-hover:opacity-100">
                  <div className="flex flex-col gap-1">
                    {i > 0 && (
                      <button type="button" onClick={() => moveImage(i, -1)}
                        className="w-7 h-7 bg-white/90 rounded-md flex items-center justify-center text-gray-700 hover:bg-white text-xs font-bold">
                        ←
                      </button>
                    )}
                    {i < form.imageUrls.length - 1 && (
                      <button type="button" onClick={() => moveImage(i, 1)}
                        className="w-7 h-7 bg-white/90 rounded-md flex items-center justify-center text-gray-700 hover:bg-white text-xs font-bold">
                        →
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => removeImage(i)}
                    className="w-7 h-7 bg-red-500/90 rounded-md flex items-center justify-center text-white hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>

                {/* First image badge */}
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    Copertă
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
            ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 size={28} className="animate-spin text-primary-500" />
              <p className="text-sm">Se încarcă imaginile...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload size={28} className="text-gray-400" />
              <p className="text-sm">
                <span className="text-primary-600 font-medium">Click pentru a selecta</span> sau trage imaginile aici
              </p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP — max. 5MB per imagine</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) {
              uploadFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={saving || uploading}>
        {saving ? 'Se salvează...' : propertyId ? 'Salvează modificările' : 'Creează proprietate'}
      </button>
    </form>
  );
}
