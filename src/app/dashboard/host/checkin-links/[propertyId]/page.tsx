'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Car, MapPin, Building2, KeyRound, Wifi,
  Home, ShieldCheck, LogOut, Phone, Video, ArrowLeft, Save,
} from 'lucide-react';
import { toast } from 'sonner';

const ACCESS_TYPES = [
  { value: '', label: 'Selectează...' },
  { value: 'key_box', label: 'Cutie de chei (key box)' },
  { value: 'smart_lock', label: 'Broască inteligentă / Cod digital' },
  { value: 'host_handover', label: 'Predare personală de gazdă' },
  { value: 'key_pickup', label: 'Ridicare chei de la o locație' },
];

interface FormState {
  checkInFrom: string; checkInTo: string; checkOutBy: string;
  parkingAvailable: boolean; parkingInfo: string; parkingLocation: string; parkingCode: string; transportInfo: string;
  buildingEntrance: string; buildingFloor: string; buildingCode: string; buildingNotes: string;
  accessType: string; accessCode: string; accessLocation: string; accessNotes: string;
  wifiName: string; wifiPassword: string;
  apartmentGuide: string; houseRules: string;
  checkOutNotes: string;
  hostPhone: string; emergencyPhone: string;
  videoUrl: string;
}

const empty: FormState = {
  checkInFrom: '', checkInTo: '', checkOutBy: '',
  parkingAvailable: false, parkingInfo: '', parkingLocation: '', parkingCode: '', transportInfo: '',
  buildingEntrance: '', buildingFloor: '', buildingCode: '', buildingNotes: '',
  accessType: '', accessCode: '', accessLocation: '', accessNotes: '',
  wifiName: '', wifiPassword: '',
  apartmentGuide: '', houseRules: '',
  checkOutNotes: '',
  hostPhone: '', emergencyPhone: '',
  videoUrl: '',
};

function linkToForm(link: Record<string, unknown>): FormState {
  return {
    checkInFrom: (link.checkInFrom as string) || '',
    checkInTo: (link.checkInTo as string) || '',
    checkOutBy: (link.checkOutBy as string) || '',
    parkingAvailable: Boolean(link.parkingAvailable),
    parkingInfo: (link.parkingInfo as string) || '',
    parkingLocation: (link.parkingLocation as string) || '',
    parkingCode: (link.parkingCode as string) || '',
    transportInfo: (link.transportInfo as string) || '',
    buildingEntrance: (link.buildingEntrance as string) || '',
    buildingFloor: (link.buildingFloor as string) || '',
    buildingCode: (link.buildingCode as string) || '',
    buildingNotes: (link.buildingNotes as string) || '',
    accessType: (link.accessType as string) || '',
    accessCode: (link.accessCode as string) || '',
    accessLocation: (link.accessLocation as string) || '',
    accessNotes: (link.accessNotes as string) || '',
    wifiName: (link.wifiName as string) || '',
    wifiPassword: (link.wifiPassword as string) || '',
    apartmentGuide: (link.apartmentGuide as string) || '',
    houseRules: (link.houseRules as string) || '',
    checkOutNotes: (link.checkOutNotes as string) || '',
    hostPhone: (link.hostPhone as string) || '',
    emergencyPhone: (link.emergencyPhone as string) || '',
    videoUrl: (link.videoUrl as string) || '',
  };
}

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h2 className={`flex items-center gap-2 font-semibold text-base mb-4 ${color}`}>
        <Icon size={18} />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function CheckInLinkEditPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [propertyTitle, setPropertyTitle] = useState('');
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/checkin-link`)
      .then(r => r.json())
      .then(data => {
        if (data.link) setForm(linkToForm(data.link));
        if (data.title) setPropertyTitle(data.title);
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const setBool = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.checked }));

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/properties/${propertyId}/checkin-link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Ghid salvat cu succes');
      router.push('/dashboard/host/checkin-links');
    } else {
      toast.error('Eroare la salvare');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-32" />)}</div>
      </div>
    );
  }

  const inp = 'input';
  const ta = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none';

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/host/checkin-links" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editează ghidul de check-in</h1>
          {propertyTitle && <p className="text-sm text-gray-500 mt-0.5">{propertyTitle}</p>}
        </div>
      </div>

      <div className="space-y-4">

        {/* Timing */}
        <Section icon={Clock} title="Program" color="text-blue-600">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Check-in de la</label>
              <input type="time" className={inp} value={form.checkInFrom} onChange={set('checkInFrom')} />
            </div>
            <div>
              <label className="label">Check-in până la</label>
              <input type="time" className={inp} value={form.checkInTo} onChange={set('checkInTo')} />
            </div>
            <div>
              <label className="label">Check-out până la</label>
              <input type="time" className={inp} value={form.checkOutBy} onChange={set('checkOutBy')} />
            </div>
          </div>
        </Section>

        {/* Getting there */}
        <Section icon={Car} title="Cum ajungi / Parcare" color="text-orange-600">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.parkingAvailable} onChange={setBool('parkingAvailable')} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm font-medium">Parcare disponibilă</span>
            </label>
            {form.parkingAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Locul de parcare</label>
                  <input className={inp} placeholder="Ex: Nivelul -1, locul 42" value={form.parkingLocation} onChange={set('parkingLocation')} />
                </div>
                <div>
                  <label className="label">Cod acces parcare</label>
                  <input className={inp} placeholder="Ex: #1234" value={form.parkingCode} onChange={set('parkingCode')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Adresă / cum se ajunge la parcare</label>
                  <input className={inp} placeholder="Ex: Intrarea în parcare pe Strada Florilor, lângă supermarket" value={form.parkingInfo} onChange={set('parkingInfo')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">Transport în comun (opțional)</label>
              <input className={inp} placeholder="Ex: Metrou Unirii — 3 min pe jos" value={form.transportInfo} onChange={set('transportInfo')} />
            </div>
          </div>
        </Section>

        {/* Building */}
        <Section icon={Building2} title="Intrare în clădire" color="text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Intrarea în clădire</label>
              <input className={inp} placeholder="Ex: Intrarea principală pe Strada Florilor, nr. 5 — ușa albastră" value={form.buildingEntrance} onChange={set('buildingEntrance')} />
            </div>
            <div>
              <label className="label">Etaj / Apartament</label>
              <input className={inp} placeholder="Ex: Etaj 3, Ap. 12" value={form.buildingFloor} onChange={set('buildingFloor')} />
            </div>
            <div>
              <label className="label">Cod interfon / intrare</label>
              <input className={inp} placeholder="Ex: 0742" value={form.buildingCode} onChange={set('buildingCode')} />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Note suplimentare</label>
            <textarea className={ta} rows={2} placeholder="Ex: Sună de două ori, apoi uși se deblochează automat" value={form.buildingNotes} onChange={set('buildingNotes')} />
          </div>
        </Section>

        {/* Apartment access */}
        <Section icon={KeyRound} title="Acces apartament" color="text-yellow-600">
          <div className="space-y-3">
            <div>
              <label className="label">Metodă de acces</label>
              <select className={inp} value={form.accessType} onChange={set('accessType')}>
                {ACCESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.accessType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Cod / PIN</label>
                  <input className={inp} placeholder="Ex: 1234" value={form.accessCode} onChange={set('accessCode')} />
                </div>
                <div>
                  <label className="label">Unde se află cheia / cutia</label>
                  <input className={inp} placeholder="Ex: Cutia e pe peretele din stânga ușii" value={form.accessLocation} onChange={set('accessLocation')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">Instrucțiuni suplimentare acces</label>
              <textarea className={ta} rows={2} placeholder="Ex: Ușa se trage ușor spre tine înainte de a introduce codul" value={form.accessNotes} onChange={set('accessNotes')} />
            </div>
          </div>
        </Section>

        {/* WiFi */}
        <Section icon={Wifi} title="Wi-Fi" color="text-green-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nume rețea</label>
              <input className={inp} placeholder="Ex: CasaMea_5G" value={form.wifiName} onChange={set('wifiName')} />
            </div>
            <div>
              <label className="label">Parolă</label>
              <input className={inp} placeholder="Ex: parola1234" value={form.wifiPassword} onChange={set('wifiPassword')} />
            </div>
          </div>
        </Section>

        {/* Apartment guide */}
        <Section icon={Home} title="Ghid apartament" color="text-teal-600">
          <textarea
            className={ta}
            rows={6}
            placeholder={`Descrie cum funcționează aparatele și ce trebuie să știe oaspetele:\n\n• Termostat: butonul rotund din living, setează temperatura dorită\n• Mașina de spălat: butonul de start e cel verde din stânga\n• Cafetieră: capsulele se găsesc în sertarul de sub aparat\n• Gunoi: se separă în pubelele colorate din fața blocului`}
            value={form.apartmentGuide}
            onChange={set('apartmentGuide')}
          />
        </Section>

        {/* House rules */}
        <Section icon={ShieldCheck} title="Reguli casă" color="text-purple-600">
          <textarea
            className={ta}
            rows={4}
            placeholder={`Ex:\n• Fără fumat în interior\n• Fără animale de companie\n• Liniște după ora 22:00\n• Maxim 4 persoane`}
            value={form.houseRules}
            onChange={set('houseRules')}
          />
        </Section>

        {/* Check-out */}
        <Section icon={LogOut} title="Instrucțiuni check-out" color="text-red-600">
          <textarea
            className={ta}
            rows={5}
            placeholder={`Descrie ce trebuie să facă oaspetele la plecare:\n\n• Lasă cheile pe masa din hol\n• Închide toate geamurile și ușa de la intrare\n• Pune vasele în mașina de spălat\n• Aruncă gunoiul la pubele`}
            value={form.checkOutNotes}
            onChange={set('checkOutNotes')}
          />
        </Section>

        {/* Contact */}
        <Section icon={Phone} title="Contact" color="text-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Telefon gazdă</label>
              <input className={inp} placeholder="Ex: +40 722 123 456" value={form.hostPhone} onChange={set('hostPhone')} />
            </div>
            <div>
              <label className="label">Contact urgențe / administrator</label>
              <input className={inp} placeholder="Ex: +40 722 999 888" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
            </div>
          </div>
        </Section>

        {/* Media */}
        <Section icon={Video} title="Video de bun venit (opțional)" color="text-pink-600">
          <div>
            <label className="label">Link YouTube sau Vimeo</label>
            <input type="url" className={inp} placeholder="https://youtube.com/watch?v=..." value={form.videoUrl} onChange={set('videoUrl')} />
          </div>
        </Section>

      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-4 py-3 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-end gap-3">
        <Link href="/dashboard/host/checkin-links" className="btn-secondary">
          Anulează
        </Link>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={16} />
          {saving ? 'Se salvează…' : 'Salvează ghidul'}
        </button>
      </div>
      {/* Spacer so last card isn't hidden behind the fixed bar */}
      <div className="h-20" />
    </div>
  );
}
