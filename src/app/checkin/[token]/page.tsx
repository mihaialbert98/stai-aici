import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  MapPin, Clock, Car, Building2, KeyRound, Wifi,
  Home, ShieldCheck, LogOut, Phone, Video, MessageCircle,
  Navigation,
} from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { StayViaraLogo } from '@/components/StayViaraLogo';
import { cookies } from 'next/headers';
import { LanguageToggleLinks } from '@/components/LanguageToggle';
import type { Lang } from '@/lib/i18n';
import { checkinT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

interface Props {
  params: { token: string };
  searchParams: { lang?: string };
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon, label, iconBg, iconColor,
}: {
  icon: React.ElementType; label: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={15} className={iconColor} />
      </div>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.08em]">{label}</h2>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.06] mx-5" />;
}

function InfoRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-100 text-sm text-right max-w-[200px] break-words">{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  );
}

export default async function CheckInPage({ params, searchParams }: Props) {
  const cookieLang = cookies().get('stayviara-lang')?.value;
  const lang: Lang = searchParams.lang === 'en' ? 'en'
    : searchParams.lang === 'ro' ? 'ro'
    : cookieLang === 'en' ? 'en'
    : 'ro';
  const t = checkinT[lang];

  const link = await prisma.checkInLink.findUnique({
    where: { token: params.token },
    include: {
      property: {
        select: {
          title: true,
          city: true,
          address: true,
          locationMapUrl: true,
          images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (!link || !link.isActive) notFound();

  const { property } = link;
  const heroImage = property.images[0]?.url;

  const addressLine = [property.address, property.city].filter(Boolean).join(', ');
  const locationUrl = property.locationMapUrl
    || (addressLine ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}` : null);

  const hasParking = link.parkingAvailable || link.parkingInfo || link.parkingLocation || link.parkingCode || link.transportInfo;
  const hasBuilding = link.buildingEntrance || link.buildingFloor || link.buildingCode || link.buildingNotes;
  const hasAccess = link.accessType || link.accessCode || link.accessLocation || link.accessNotes;
  const hasWifi = link.wifiName || link.wifiPassword;
  const hasContact = link.hostPhone || link.emergencyPhone;
  const hasVideo = Boolean(link.videoUrl);

  return (
    <div className="min-h-screen bg-[#0F172A]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Hero ── */}
      <div className="relative w-full h-48 md:h-64 bg-slate-900">
        {heroImage && (
          <img
            src={heroImage}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/30 to-transparent" />

        {/* Language toggle */}
        <div className="absolute top-4 right-4 z-10 backdrop-blur-sm bg-black/30 rounded-full px-1 py-0.5">
          <LanguageToggleLinks current={lang} baseUrl={`/checkin/${params.token}`} />
        </div>

        {/* Property name & address */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h1
            className="text-white font-bold text-[1.6rem] leading-tight mb-1.5 drop-shadow-sm"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {property.title}
          </h1>
          {addressLine && (
            <a href={locationUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-white/65 text-sm flex items-center gap-1.5 hover:text-white/90 transition-colors">
              <MapPin size={12} className="flex-shrink-0" />
              {addressLine}
            </a>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Location */}
        {(addressLine || property.locationMapUrl) && (
          <Section>
            <SectionHeader icon={MapPin} label={t.location} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" />
            <Divider />
            <div className="px-5 py-4">
              {addressLine && <p className="text-sm text-slate-300 mb-3">{addressLine}</p>}
              {locationUrl && (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity active:opacity-80 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)' }}
                >
                  <Navigation size={15} />
                  {t.openInMaps}
                </a>
              )}
            </div>
          </Section>
        )}

        {/* Schedule */}
        {(link.checkInFrom || link.checkInTo || link.checkOutBy) && (
          <Section>
            <SectionHeader icon={Clock} label={t.schedule} iconBg="bg-blue-500/15" iconColor="text-blue-400" />
            <Divider />
            <div className="px-4 py-4 grid grid-cols-2 gap-2.5">
              {(link.checkInFrom || link.checkInTo) && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-center">
                  <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-[0.1em] mb-1.5">{t.checkIn}</p>
                  <p className="font-bold text-xl text-blue-300 tabular-nums">
                    {link.checkInFrom || '–'}{link.checkInTo ? `–${link.checkInTo}` : ''}
                  </p>
                </div>
              )}
              {link.checkOutBy && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-center">
                  <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-[0.1em] mb-1.5">{t.checkOut}</p>
                  <p className="font-bold text-xl text-amber-300 tabular-nums">
                    {t.until} {link.checkOutBy}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* WiFi */}
        {hasWifi && (
          <Section>
            <SectionHeader icon={Wifi} label={t.wifi} iconBg="bg-emerald-500/15" iconColor="text-emerald-400" />
            <Divider />
            <div className="px-5 py-4 space-y-2">
              {link.wifiName && (
                <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mb-0.5">{t.network}</p>
                    <p className="font-semibold text-slate-100 text-sm truncate" style={{ fontFamily: 'ui-monospace, monospace' }}>
                      {link.wifiName}
                    </p>
                  </div>
                  <CopyButton value={link.wifiName} />
                </div>
              )}
              {link.wifiPassword && (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-[0.1em] mb-0.5">{t.password}</p>
                    <p className="font-semibold text-emerald-300 text-sm tracking-widest truncate" style={{ fontFamily: 'ui-monospace, monospace' }}>
                      {link.wifiPassword}
                    </p>
                  </div>
                  <CopyButton value={link.wifiPassword} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Building access */}
        {hasBuilding && (
          <Section>
            <SectionHeader icon={Building2} label={t.building} iconBg="bg-slate-500/15" iconColor="text-slate-400" />
            <Divider />
            <div className="px-5 py-4 space-y-0">
              {link.buildingEntrance && (
                <p className="text-sm text-slate-300 pb-2">{link.buildingEntrance}</p>
              )}
              {link.buildingFloor && <InfoRow label={t.floor} value={link.buildingFloor} />}
              {link.buildingCode && <InfoRow label={t.buildingCode} value={link.buildingCode} copy />}
              {link.buildingNotes && (
                <p className="text-sm text-slate-300 mt-2 bg-white/[0.03] rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                  {link.buildingNotes}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Apartment access */}
        {hasAccess && (
          <Section>
            <SectionHeader icon={KeyRound} label={t.access} iconBg="bg-amber-500/15" iconColor="text-amber-400" />
            <Divider />
            <div className="px-5 py-4 space-y-0">
              {link.accessType && (
                <div className="inline-flex items-center text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 px-3 py-1.5 rounded-full mb-2">
                  {t.accessTypes[link.accessType as keyof typeof t.accessTypes] || link.accessType}
                </div>
              )}
              {link.accessCode && <InfoRow label="Cod / PIN" value={link.accessCode} copy />}
              {link.accessLocation && <InfoRow label={lang === 'ro' ? 'Locație cheie / cutie' : 'Key / lockbox location'} value={link.accessLocation} />}
              {link.accessNotes && (
                <p className="text-sm text-slate-300 mt-2 bg-white/[0.03] rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                  {link.accessNotes}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Parking & transport */}
        {hasParking && (
          <Section>
            <SectionHeader icon={Car} label={t.parking} iconBg="bg-orange-500/15" iconColor="text-orange-400" />
            <Divider />
            <div className="px-5 py-4 space-y-0">
              {link.parkingAvailable && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-full mb-3">
                  ✓ {t.parkingAvailable}
                </div>
              )}
              {link.parkingInfo && (
                <p className="text-sm text-slate-300 pb-2">{link.parkingInfo}</p>
              )}
              {link.parkingLocation && <InfoRow label={t.parkingSpot} value={link.parkingLocation} />}
              {link.parkingCode && <InfoRow label={t.parkingCode} value={link.parkingCode} copy />}
              {link.parkingMapUrl && (
                <a
                  href={link.parkingMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-xl text-orange-300 text-sm font-semibold bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/20 active:bg-orange-500/20 transition-colors"
                >
                  <MapPin size={14} />
                  {t.viewParkingMap}
                </a>
              )}
              {link.transportInfo && (
                <p className="text-sm text-slate-400 pt-2 flex items-start gap-1.5">
                  <MapPin size={13} className="mt-0.5 flex-shrink-0 text-slate-600" />
                  {link.transportInfo}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Apartment guide */}
        {link.apartmentGuide && (
          <Section>
            <SectionHeader icon={Home} label={t.apartment} iconBg="bg-teal-500/15" iconColor="text-teal-400" />
            <Divider />
            <div className="px-5 py-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/[0.03] rounded-xl p-3">{link.apartmentGuide}</p>
            </div>
          </Section>
        )}

        {/* House rules */}
        {link.houseRules && (
          <Section>
            <SectionHeader icon={ShieldCheck} label={t.rules} iconBg="bg-violet-500/15" iconColor="text-violet-400" />
            <Divider />
            <div className="px-5 py-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/[0.03] rounded-xl p-3">{link.houseRules}</p>
            </div>
          </Section>
        )}

        {/* Check-out */}
        {link.checkOutNotes && (
          <Section>
            <SectionHeader icon={LogOut} label={t.checkout} iconBg="bg-amber-500/15" iconColor="text-amber-400" />
            <Divider />
            <div className="px-5 py-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/[0.03] rounded-xl p-3">{link.checkOutNotes}</p>
            </div>
          </Section>
        )}

        {/* Contact */}
        {hasContact && (
          <Section>
            <SectionHeader icon={Phone} label={t.contact} iconBg="bg-slate-500/15" iconColor="text-slate-400" />
            <Divider />
            <div className="px-5 py-4 space-y-3">
              {link.hostPhone && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">{t.host}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${link.hostPhone}`}
                      className="text-sm font-semibold text-slate-100 hover:text-white transition-colors"
                    >
                      {link.hostPhone}
                    </a>
                    <a
                      href={`https://wa.me/${link.hostPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-300 font-semibold hover:bg-green-500/25 transition-colors"
                    >
                      <MessageCircle size={11} />
                      {t.whatsapp}
                    </a>
                  </div>
                </div>
              )}
              {link.emergencyPhone && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">{t.emergency}</span>
                  <a
                    href={`tel:${link.emergencyPhone}`}
                    className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {link.emergencyPhone}
                  </a>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Video */}
        {hasVideo && (
          <Section>
            <SectionHeader icon={Video} label={t.video} iconBg="bg-pink-500/15" iconColor="text-pink-400" />
            <Divider />
            <div className="p-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={link.videoUrl!
                    .replace('watch?v=', 'embed/')
                    .replace('youtu.be/', 'www.youtube.com/embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="flex justify-center pt-4 pb-8">
          <StayViaraLogo className="opacity-25 [filter:invert(1)_brightness(2)]" />
        </div>

      </div>
    </div>
  );
}
