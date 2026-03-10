'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';

export default function NewPropertyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

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
      if (!res.ok) { setError(data.error); return; }
      setImageUrls(prev => [...prev, ...data.images.map((img: { url: string }) => img.url)]);
    } catch {
      setError('Eroare la încărcarea imaginilor');
    }
    setUploading(false);
  }, []);

  const removeImage = (idx: number) => {
    const url = imageUrls[idx];
    if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
      fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    }
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Introduceți un nume pentru proprietate'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Eroare la creare'); setSaving(false); return; }
      router.push(`/dashboard/host/properties/${data.property.id}/edit`);
    } catch {
      setError('Eroare la creare');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Proprietate nouă</h1>
      <p className="text-gray-500 text-sm mb-8">Adaugă un nume și o fotografie. Poți completa restul detaliilor după.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="label">Numele proprietății</label>
          <input
            type="text"
            className="input"
            placeholder="ex: Apartament central Cluj"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="label">Fotografie <span className="text-gray-400 font-normal">(opțional)</span></label>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {imageUrls.map((url, i) => (
                <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3]">
                  <img src={url} alt={`Imagine ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500/90 rounded-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                      Copertă
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
              ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Se încarcă...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={24} />
                <span className="text-sm">Trage o imagine aici sau <span className="text-primary-600 font-medium">selectează fișier</span></span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
            Anulează
          </button>
          <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Creează proprietatea'}
          </button>
        </div>
      </form>
    </div>
  );
}
