'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Car, MapPin, Building2, KeyRound, Wifi,
  Home, ShieldCheck, LogOut, Phone, Video, ArrowLeft, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

interface FormState {
  checkInFrom: string; checkInTo: string; checkOutBy: string;
  parkingAvailable: boolean; parkingInfo: string; parkingLocation: string; parkingCode: string; parkingMapUrl: string; transportInfo: string;
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
  parkingAvailable: false, parkingInfo: '', parkingLocation: '', parkingCode: '', parkingMapUrl: '', transportInfo: '',
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
    parkingMapUrl: (link.parkingMapUrl as string) || '',
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
  const lang = useLang();
  const t = dashboardT[lang].checkinEditor;
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const ACCESS_TYPES = [
    { value: '', label: t.accessMethodPh },
    { value: 'key_box', label: t.accessTypes.key_box },
    { value: 'smart_lock', label: t.accessTypes.smart_lock },
    { value: 'host_handover', label: t.accessTypes.host_handover },
    { value: 'key_pickup', label: t.accessTypes.key_pickup },
  ];

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
      toast.success(t.savedSuccess);
      router.push('/dashboard/host/checkin-links');
    } else {
      toast.error(t.saveError);
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
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {propertyTitle && <p className="text-sm text-gray-500 mt-0.5">{propertyTitle}</p>}
        </div>
      </div>

      <div className="space-y-4">

        {/* Timing */}
        <Section icon={Clock} title={t.sectionSchedule} color="text-blue-600">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t.checkInFrom}</label>
              <input type="time" className={inp} value={form.checkInFrom} onChange={set('checkInFrom')} />
            </div>
            <div>
              <label className="label">{t.checkInTo}</label>
              <input type="time" className={inp} value={form.checkInTo} onChange={set('checkInTo')} />
            </div>
            <div>
              <label className="label">{t.checkOutBy}</label>
              <input type="time" className={inp} value={form.checkOutBy} onChange={set('checkOutBy')} />
            </div>
          </div>
        </Section>

        {/* Getting there */}
        <Section icon={Car} title={t.sectionParking} color="text-orange-600">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.parkingAvailable} onChange={setBool('parkingAvailable')} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm font-medium">{t.parkingAvailable}</span>
            </label>
            {form.parkingAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t.parkingSpot}</label>
                  <input className={inp} placeholder={t.parkingSpotPh} value={form.parkingLocation} onChange={set('parkingLocation')} />
                </div>
                <div>
                  <label className="label">{t.parkingCode}</label>
                  <input className={inp} placeholder={t.parkingCodePh} value={form.parkingCode} onChange={set('parkingCode')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Link Google Maps parcare</label>
                  <input className={inp} placeholder="https://maps.app.goo.gl/..." value={form.parkingMapUrl} onChange={set('parkingMapUrl')} />
                  <p className="text-xs text-gray-400 mt-1">Deschide Google Maps → caută locul de parcare → Share → Copy link</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t.parkingAddress}</label>
                  <input className={inp} placeholder={t.parkingAddressPh} value={form.parkingInfo} onChange={set('parkingInfo')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">{t.transport}</label>
              <input className={inp} placeholder={t.transportPh} value={form.transportInfo} onChange={set('transportInfo')} />
            </div>
          </div>
        </Section>

        {/* Building */}
        <Section icon={Building2} title={t.sectionBuilding} color="text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">{t.buildingEntrance}</label>
              <input className={inp} placeholder={t.buildingEntrancePh} value={form.buildingEntrance} onChange={set('buildingEntrance')} />
            </div>
            <div>
              <label className="label">{t.buildingFloor}</label>
              <input className={inp} placeholder={t.buildingFloorPh} value={form.buildingFloor} onChange={set('buildingFloor')} />
            </div>
            <div>
              <label className="label">{t.buildingCode}</label>
              <input className={inp} placeholder={t.buildingCodePh} value={form.buildingCode} onChange={set('buildingCode')} />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">{t.buildingNotes}</label>
            <textarea className={ta} rows={2} placeholder={t.buildingNotesPh} value={form.buildingNotes} onChange={set('buildingNotes')} />
          </div>
        </Section>

        {/* Apartment access */}
        <Section icon={KeyRound} title={t.sectionAccess} color="text-yellow-600">
          <div className="space-y-3">
            <div>
              <label className="label">{t.accessMethod}</label>
              <select className={inp} value={form.accessType} onChange={set('accessType')}>
                {ACCESS_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
              </select>
            </div>
            {form.accessType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t.accessCode}</label>
                  <input className={inp} placeholder={t.accessCodePh} value={form.accessCode} onChange={set('accessCode')} />
                </div>
                <div>
                  <label className="label">{t.accessLocation}</label>
                  <input className={inp} placeholder={t.accessLocationPh} value={form.accessLocation} onChange={set('accessLocation')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">{t.accessNotes}</label>
              <textarea className={ta} rows={2} placeholder={t.accessNotesPh} value={form.accessNotes} onChange={set('accessNotes')} />
            </div>
          </div>
        </Section>

        {/* WiFi */}
        <Section icon={Wifi} title={t.sectionWifi} color="text-green-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t.wifiName}</label>
              <input className={inp} placeholder={t.wifiNamePh} value={form.wifiName} onChange={set('wifiName')} />
            </div>
            <div>
              <label className="label">{t.wifiPassword}</label>
              <input className={inp} placeholder={t.wifiPasswordPh} value={form.wifiPassword} onChange={set('wifiPassword')} />
            </div>
          </div>
        </Section>

        {/* Apartment guide */}
        <Section icon={Home} title={t.sectionApartment} color="text-teal-600">
          <textarea
            className={ta}
            rows={6}
            placeholder={t.apartmentPh}
            value={form.apartmentGuide}
            onChange={set('apartmentGuide')}
          />
        </Section>

        {/* House rules */}
        <Section icon={ShieldCheck} title={t.sectionRules} color="text-purple-600">
          <textarea
            className={ta}
            rows={4}
            placeholder={t.rulesPh}
            value={form.houseRules}
            onChange={set('houseRules')}
          />
        </Section>

        {/* Check-out */}
        <Section icon={LogOut} title={t.sectionCheckout} color="text-red-600">
          <textarea
            className={ta}
            rows={5}
            placeholder={t.checkoutPh}
            value={form.checkOutNotes}
            onChange={set('checkOutNotes')}
          />
        </Section>

        {/* Contact */}
        <Section icon={Phone} title={t.sectionContact} color="text-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t.hostPhone}</label>
              <input className={inp} placeholder={t.hostPhonePh} value={form.hostPhone} onChange={set('hostPhone')} />
            </div>
            <div>
              <label className="label">{t.emergencyPhone}</label>
              <input className={inp} placeholder={t.emergencyPhonePh} value={form.emergencyPhone} onChange={set('emergencyPhone')} />
            </div>
          </div>
        </Section>

        {/* Media */}
        <Section icon={Video} title={t.sectionVideo} color="text-pink-600">
          <div>
            <label className="label">{t.videoUrl}</label>
            <input type="url" className={inp} placeholder={t.videoUrlPh} value={form.videoUrl} onChange={set('videoUrl')} />
          </div>
        </Section>

      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-4 py-3 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-end gap-3">
        <Link href="/dashboard/host/checkin-links" className="btn-secondary">
          {t.cancel}
        </Link>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={16} />
          {saving ? t.saving : t.save}
        </button>
      </div>
      {/* Spacer so last card isn't hidden behind the fixed bar */}
      <div className="h-20" />
    </div>
  );
}
