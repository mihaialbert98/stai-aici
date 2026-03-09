import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  MapPin, Clock, Car, Building2, KeyRound, Wifi,
  Home, ShieldCheck, LogOut, Phone, Video, MessageCircle,
} from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { NestlyLogo } from '@/components/NestlyLogo';

export const dynamic = 'force-dynamic';

interface Props {
  params: { token: string };
}

const ACCESS_LABELS: Record<string, string> = {
  key_box: 'Cutie de chei',
  smart_lock: 'Broască inteligentă / Cod digital',
  host_handover: 'Predare personală',
  key_pickup: 'Ridicare chei',
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <h2 className={`flex items-center gap-2 font-semibold text-base mb-3 ${color}`}>
      <Icon size={18} />
      {label}
    </h2>
  );
}

function Row({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-right">{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  );
}

export default async function CheckInPage({ params }: Props) {
  const link = await prisma.checkInLink.findUnique({
    where: { token: params.token },
    include: {
      property: {
        select: {
          title: true,
          city: true,
          address: true,
          images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (!link || !link.isActive) notFound();

  const { property } = link;
  const heroImage = property.images[0]?.url;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;

  const hasParking = link.parkingAvailable || link.parkingInfo || link.parkingLocation || link.parkingCode || link.transportInfo;
  const hasBuilding = link.buildingEntrance || link.buildingFloor || link.buildingCode || link.buildingNotes;
  const hasAccess = link.accessType || link.accessCode || link.accessLocation || link.accessNotes;
  const hasWifi = link.wifiName || link.wifiPassword;
  const hasContact = link.hostPhone || link.emergencyPhone;
  const hasVideo = Boolean(link.videoUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      {heroImage && (
        <div className="w-full h-56 md:h-72 overflow-hidden">
          <img src={heroImage} alt={property.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-7 space-y-4">

        {/* Title + address */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{property.title}</h1>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary-600 hover:underline text-sm">
            <MapPin size={15} />
            {property.address}, {property.city}
          </a>
        </div>

        {/* Timing */}
        {(link.checkInFrom || link.checkInTo || link.checkOutBy) && (
          <Card>
            <SectionTitle icon={Clock} label="Program" color="text-blue-600" />
            <div className="grid grid-cols-2 gap-3">
              {(link.checkInFrom || link.checkInTo) && (
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Check-in</p>
                  <p className="font-bold text-lg text-blue-800">
                    {link.checkInFrom || '–'}{link.checkInTo ? ` – ${link.checkInTo}` : ''}
                  </p>
                </div>
              )}
              {link.checkOutBy && (
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-orange-500 font-medium uppercase tracking-wide mb-1">Check-out</p>
                  <p className="font-bold text-lg text-orange-800">până la {link.checkOutBy}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Parking & transport */}
        {hasParking && (
          <Card>
            <SectionTitle icon={Car} label="Parcare & transport" color="text-orange-600" />
            {link.parkingAvailable && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-3">
                Parcare disponibilă
              </div>
            )}
            {link.parkingInfo && <p className="text-sm text-gray-700 mb-2">{link.parkingInfo}</p>}
            {link.parkingLocation && <Row label="Locul de parcare" value={link.parkingLocation} />}
            {link.parkingCode && <Row label="Cod acces" value={link.parkingCode} copy />}
            {link.transportInfo && (
              <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                {link.transportInfo}
              </p>
            )}
          </Card>
        )}

        {/* Building access */}
        {hasBuilding && (
          <Card>
            <SectionTitle icon={Building2} label="Intrare în clădire" color="text-slate-600" />
            {link.buildingEntrance && <p className="text-sm text-gray-700 mb-2">{link.buildingEntrance}</p>}
            {link.buildingFloor && <Row label="Etaj / Apartament" value={link.buildingFloor} />}
            {link.buildingCode && <Row label="Cod interfon / intrare" value={link.buildingCode} copy />}
            {link.buildingNotes && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{link.buildingNotes}</p>
            )}
          </Card>
        )}

        {/* Apartment access */}
        {hasAccess && (
          <Card>
            <SectionTitle icon={KeyRound} label="Acces apartament" color="text-yellow-600" />
            {link.accessType && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full mb-3">
                {ACCESS_LABELS[link.accessType] || link.accessType}
              </div>
            )}
            {link.accessCode && <Row label="Cod / PIN" value={link.accessCode} copy />}
            {link.accessLocation && <Row label="Locație cheie / cutie" value={link.accessLocation} />}
            {link.accessNotes && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{link.accessNotes}</p>
            )}
          </Card>
        )}

        {/* WiFi */}
        {hasWifi && (
          <Card>
            <SectionTitle icon={Wifi} label="Wi-Fi" color="text-green-600" />
            {link.wifiName && <Row label="Rețea" value={link.wifiName} copy />}
            {link.wifiPassword && <Row label="Parolă" value={link.wifiPassword} copy />}
          </Card>
        )}

        {/* Apartment guide */}
        {link.apartmentGuide && (
          <Card>
            <SectionTitle icon={Home} label="Ghid apartament" color="text-teal-600" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{link.apartmentGuide}</p>
          </Card>
        )}

        {/* House rules */}
        {link.houseRules && (
          <Card>
            <SectionTitle icon={ShieldCheck} label="Reguli casă" color="text-purple-600" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{link.houseRules}</p>
          </Card>
        )}

        {/* Contact */}
        {hasContact && (
          <Card>
            <SectionTitle icon={Phone} label="Contact" color="text-gray-600" />
            <div className="space-y-3">
              {link.hostPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Gazdă</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${link.hostPhone}`} className="text-sm font-medium text-primary-600 hover:underline">{link.hostPhone}</a>
                    <a href={`https://wa.me/${link.hostPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition">
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
              {link.emergencyPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Urgențe</span>
                  <a href={`tel:${link.emergencyPhone}`} className="text-sm font-medium text-red-600 hover:underline">{link.emergencyPhone}</a>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Check-out */}
        {link.checkOutNotes && (
          <Card className="border-orange-100 bg-orange-50">
            <SectionTitle icon={LogOut} label="Instrucțiuni check-out" color="text-orange-600" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{link.checkOutNotes}</p>
          </Card>
        )}

        {/* Video */}
        {hasVideo && (
          <Card>
            <SectionTitle icon={Video} label="Video de bun venit" color="text-pink-600" />
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={link.videoUrl!.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="flex justify-center pt-2 pb-4">
          <NestlyLogo className="opacity-30" />
        </div>

      </div>
    </div>
  );
}
