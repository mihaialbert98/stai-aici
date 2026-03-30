'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, PenLine, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface GuestFormLink {
  id: string;
  token: string;
  isActive: boolean;
  activeGuestCount: number;
}

interface Property {
  id: string;
  title: string;
  guestCapacity: number;
  images: { url: string }[];
  guestFormLink: GuestFormLink | null;
}

const publicUrl = (token: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${token}`;

export default function NewRegistrationPage() {
  const lang = useLang();
  const t = dashboardT[lang].guestForms;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCapacity, setSavingCapacity] = useState<Record<string, boolean>>({});
  const [capacityValues, setCapacityValues] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Signature state
  const [hasSignature, setHasSignature] = useState<boolean | null>(null);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [showPad, setShowPad] = useState(false);
  const [savingSig, setSavingSig] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Stable set of property IDs that were unset when the page first loaded.
  // Using a ref prevents the filter from collapsing the card after the link is generated.
  const initialUnsetRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/host/guest-forms').then(r => r.json()),
      fetch('/api/host/receptionist-signature').then(r => r.json()),
    ]).then(([formsData, sigData]) => {
      const props: Property[] = formsData.properties || [];
      setProperties(props);
      const caps: Record<string, string> = {};
      props.forEach((p: Property) => { caps[p.id] = String(p.guestCapacity); });
      setCapacityValues(caps);
      setHasSignature(!!sigData.hasSignature);
      setSignatureImg(sigData.signature ?? null);

      // Capture the initial "unset" set once so the filter is stable this session
      initialUnsetRef.current = new Set(
        props.filter((p: Property) => !p.guestFormLink).map((p: Property) => p.id)
      );

      // Eagerly generate links for properties where requirements are already met
      if (sigData.hasSignature) {
        props.forEach((p: Property) => {
          if (p.guestFormLink || p.guestCapacity < 1) return;
          fetch(`/api/properties/${p.id}/form-link`)
            .then(r => r.json())
            .then(data => {
              if (data.link) {
                setProperties(prev =>
                  prev.map(prev_p => prev_p.id === p.id ? { ...prev_p, guestFormLink: data.link } : prev_p)
                );
              }
            })
            .catch(() => {});
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  // Canvas helpers — coordinates scaled to internal canvas resolution
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
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
    setHasStrokes(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSavingSig(true);
    try {
      const res = await fetch('/api/host/receptionist-signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: dataUrl }),
      });
      if (!res.ok) { toast.error('Error'); return; }
      setSignatureImg(dataUrl);
      setHasSignature(true);
      setShowPad(false);
      setHasStrokes(false);
      toast.success(t.signatureSaved);
    } finally {
      setSavingSig(false);
    }
  };

  const ensureAndCopyLink = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    let link = property.guestFormLink;

    if (!link) {
      try {
        const res = await fetch(`/api/properties/${propertyId}/form-link`);
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || 'Error'); return; }
        link = data.link;
        setProperties(prev =>
          prev.map(p => p.id === propertyId ? { ...p, guestFormLink: data.link } : p)
        );
      } catch {
        toast.error('Error');
        return;
      }
    }

    if (!link) return;
    const url = publicUrl(link.token);
    await navigator.clipboard.writeText(url);
    toast.success(t.copied);
    setCopiedId(propertyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCapacityBlur = async (propertyId: string) => {
    const raw = capacityValues[propertyId];
    const value = parseInt(raw, 10);
    const property = properties.find(p => p.id === propertyId);
    if (!property || isNaN(value) || value < 1) return;
    if (value === property.guestCapacity) return;

    setSavingCapacity(s => ({ ...s, [propertyId]: true }));
    try {
      const res = await fetch(`/api/properties/${propertyId}/capacity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCapacity: value }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      setProperties(prev =>
        prev.map(p => p.id === propertyId ? { ...p, guestCapacity: data.guestCapacity } : p)
      );
      setCapacityValues(c => ({ ...c, [propertyId]: String(data.guestCapacity) }));
      toast.success(t.capacitySaved);
    } finally {
      setSavingCapacity(s => ({ ...s, [propertyId]: false }));
    }
  };

  const toggleActive = async (propertyId: string, link: GuestFormLink) => {
    const res = await fetch(`/api/properties/${propertyId}/form-link`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Error'); return; }
    setProperties(prev =>
      prev.map(p =>
        p.id === propertyId
          ? { ...p, guestFormLink: p.guestFormLink ? { ...p.guestFormLink, isActive: data.link.isActive } : data.link }
          : p
      )
    );
    toast.success(data.link.isActive ? t.activated : t.deactivated);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.newTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.newSubtitle}</p>
      </div>

      {/* Receptionist Signature Section */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{t.signatureTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{t.signatureHint}</p>
          </div>
          {hasSignature && !showPad && (
            <button
              onClick={() => { setShowPad(true); setHasStrokes(false); }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition shrink-0"
            >
              <PenLine size={14} /> {t.signatureChange}
            </button>
          )}
        </div>

        {/* Saved signature preview — max-w-xs keeps display ≤ 320px so the 600px PNG downsamples (crisp) */}
        {hasSignature && signatureImg && !showPad && (
          <div className="mt-3 max-w-xs">
            <div
              className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              style={{ aspectRatio: '4/1' }}
            >
              <img src={signatureImg} alt="signature" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Drawing pad — max-w-xs keeps display ≤ 320px; internal 600×150 downsamples → crisp strokes */}
        {(!hasSignature || showPad) && (
          <div className="mt-3 max-w-xs">
            <p className="text-xs text-gray-400 mb-2">{t.signatureDrawHint}</p>
            <div className="relative border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-white touch-none">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full cursor-crosshair block"
                style={{ touchAction: 'none' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <X size={14} /> {t.signatureClear}
              </button>
              {showPad && (
                <button
                  onClick={() => { setShowPad(false); clearCanvas(); }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
              )}
              <button
                onClick={handleSaveSignature}
                disabled={!hasStrokes || savingSig}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingSig ? '...' : t.signatureSave}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">{t.noPropertiesNew}</p>
        </div>
      ) : (() => {
        const unsetProperties = initialUnsetRef.current
          ? properties.filter(p => initialUnsetRef.current!.has(p.id))
          : properties.filter(p => !p.guestFormLink);
        return unsetProperties.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-700 font-medium">{t.allConfigured}</p>
            <p className="text-sm text-gray-400 mt-1">{t.allConfiguredHint}</p>
            <Link href="/dashboard/host/registrations" className="btn-primary mt-4 inline-flex">
              {lang === 'ro' ? 'Înapoi la fișe' : 'Back to registrations'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {unsetProperties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                capacityValue={capacityValues[property.id] ?? String(property.guestCapacity)}
                savingCap={savingCapacity[property.id] ?? false}
                copiedId={copiedId}
                hasSignature={hasSignature}
                t={t}
                onCapacityChange={v => setCapacityValues(c => ({ ...c, [property.id]: v }))}
                onCapacityBlur={() => handleCapacityBlur(property.id)}
                onToggle={() => toggleActive(property.id, property.guestFormLink!)}
                onCopyLink={() => ensureAndCopyLink(property.id)}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

interface PropertyCardProps {
  property: Property;
  capacityValue: string;
  savingCap: boolean;
  copiedId: string | null;
  hasSignature: boolean | null;
  t: typeof dashboardT['ro']['guestForms'];
  onCapacityChange: (v: string) => void;
  onCapacityBlur: () => void;
  onToggle: () => void;
  onCopyLink: () => void;
}

function PropertyCard({
  property,
  capacityValue,
  savingCap,
  copiedId,
  hasSignature,
  t,
  onCapacityChange,
  onCapacityBlur,
  onToggle,
  onCopyLink,
}: PropertyCardProps) {
  const link = property.guestFormLink;
  const capacityNum = parseInt(capacityValue, 10);
  const validCapacity = !isNaN(capacityNum) && capacityNum >= 1;
  const canCopyLink = hasSignature === true && validCapacity;

  return (
    <div className="card space-y-4">
      {/* Property header */}
      <div className="flex items-center gap-3">
        {property.images[0] ? (
          <img
            src={property.images[0].url}
            alt={property.title}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
        )}
        <h3 className="font-semibold">{property.title}</h3>
      </div>

      {/* Capacity input */}
      <div>
        <label className="label">{t.capacityLabel}</label>
        <p className="text-xs text-gray-400 mb-1">{t.capacityHint}</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={1}
            max={50}
            className="input w-24"
            value={capacityValue}
            onChange={e => onCapacityChange(e.target.value)}
            onBlur={onCapacityBlur}
          />
          {savingCap && (
            <span className="text-xs text-gray-400">{t.savingCapacity}</span>
          )}
        </div>
      </div>

      {/* Permanent link row */}
      <div>
        <label className="label">{t.formLinkLabel}</label>
        <div className="flex gap-2">
          <input
            readOnly
            className="input flex-1 text-sm text-gray-500 bg-gray-50"
            value={link ? publicUrl(link.token) : '—'}
          />
          <button
            onClick={onCopyLink}
            disabled={!canCopyLink}
            className="btn flex items-center gap-1.5 text-sm px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copiedId === property.id
              ? <Check size={14} className="text-green-500" />
              : <Copy size={14} />}
            {copiedId === property.id ? t.copiedBtn : t.copyLink}
          </button>
          {link && (
            <a
              href={publicUrl(link.token)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex items-center gap-1.5 text-sm px-3"
            >
              <ExternalLink size={14} /> {t.preview}
            </a>
          )}
        </div>

        {/* Always-visible requirements checklist */}
        <div className="mt-2 space-y-1">
          <p className={`flex items-center gap-1.5 text-xs ${hasSignature ? 'text-green-600' : 'text-amber-600'}`}>
            {hasSignature
              ? <CheckCircle size={13} />
              : <AlertCircle size={13} />}
            {hasSignature ? t.requirementSignatureMet : t.linkDisabledSignature}
          </p>
          <p className={`flex items-center gap-1.5 text-xs ${validCapacity ? 'text-green-600' : 'text-amber-600'}`}>
            {validCapacity
              ? <CheckCircle size={13} />
              : <AlertCircle size={13} />}
            {validCapacity ? t.requirementCapacityMet : t.linkDisabledCapacity}
          </p>
        </div>
      </div>

      {/* Active toggle */}
      {link && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {link.isActive ? t.active : t.inactive}
          </span>
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            {link.isActive
              ? <ToggleRight size={16} className="text-green-500" />
              : <ToggleLeft size={16} />}
            {link.isActive ? t.deactivate : t.activate}
          </button>
        </div>
      )}

      {/* Instructions box */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
        {t.instructions}
      </div>
    </div>
  );
}
