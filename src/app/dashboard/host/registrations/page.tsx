'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Copy, Check, Download, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface GuestForm {
  id: string;
  guestIndex: number;
  fullName: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  submittedAt: string | null;
  wordFilePath: string | null;
}

interface FormRequest {
  id: string;
  publicToken: string;
  totalGuests: number;
  createdAt: string;
  property: { id: string; title: string };
  guestForms: GuestForm[];
}

export default function RegistrationsPage() {
  const [formRequests, setFormRequests] = useState<FormRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/host/form-requests')
      .then(r => r.json())
      .then(d => setFormRequests(d.formRequests || []))
      .finally(() => setLoading(false));
  }, []);

  const publicUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${token}`;

  const copyLink = async (id: string, token: string) => {
    await navigator.clipboard.writeText(publicUrl(token));
    setCopiedId(id);
    toast.success('Link copiat!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadDoc = (requestId: string, guestFormId: string, name: string | null) => {
    const a = document.createElement('a');
    a.href = `/api/host/form-requests/${requestId}/download/${guestFormId}`;
    a.download = name ? `${name}.docx` : `fisa-${guestFormId}.docx`;
    a.click();
  };

  const dateStr = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: ro });

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Fișe de cazare</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fișe de cazare</h1>
          <p className="text-gray-500 text-sm mt-1">
            Formulare digitale pentru înregistrarea oaspeților conform legislației române.
          </p>
        </div>
        <Link href="/dashboard/host/registrations/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Fișă nouă
        </Link>
      </div>

      {formRequests.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Nu ai nicio fișă de cazare creată încă.</p>
          <Link href="/dashboard/host/registrations/new" className="btn-primary inline-flex items-center gap-1.5">
            <Plus size={16} /> Creează prima fișă
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {formRequests.map(req => {
            const submitted = req.guestForms.filter(g => g.submittedAt).length;
            const isComplete = submitted === req.totalGuests;

            return (
              <div key={req.id} className="card">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{req.property.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : submitted > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {submitted}/{req.totalGuests} completate
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {(() => {
                        const first = req.guestForms.find(g => g.arrivalDate);
                        return first
                          ? `${dateStr(first.arrivalDate!)} → ${dateStr(first.departureDate!)}`
                          : 'Date completate de oaspete';
                      })()}
                      <span className="ml-2 text-gray-400">· {req.totalGuests} oaspete{req.totalGuests !== 1 ? 'ți' : ''}</span>
                    </p>
                  </div>

                  {/* Link actions */}
                  {!isComplete && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyLink(req.id, req.publicToken)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        {copiedId === req.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        Copiază link
                      </button>
                      <a
                        href={publicUrl(req.publicToken)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <ExternalLink size={14} /> Previzualizare
                      </a>
                    </div>
                  )}
                </div>

                {/* Guest forms list */}
                {req.guestForms.some(g => g.submittedAt) && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                    {req.guestForms.filter(g => g.submittedAt).map(g => (
                      <div key={g.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-700">
                          <span className="text-gray-400 mr-2">#{g.guestIndex}</span>
                          {g.fullName || 'Necunoscut'}
                        </span>
                        {g.wordFilePath && (
                          <button
                            onClick={() => downloadDoc(req.id, g.id, g.fullName)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                          >
                            <Download size={12} /> Descarcă .docx
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
