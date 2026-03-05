import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MapPin, Wifi, Info, ShieldCheck, Lightbulb, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: { token: string };
}

async function getCheckInData(token: string) {
  const link = await prisma.checkInLink.findUnique({
    where: { token },
    include: {
      property: {
        select: {
          title: true,
          city: true,
          address: true,
          checkInInfo: true,
          houseRules: true,
          localTips: true,
          images: { orderBy: { order: 'asc' }, select: { url: true } },
          host: { select: { name: true, phone: true } },
        },
      },
    },
  });

  if (!link || !link.isActive) return null;
  return link;
}

export default async function CheckInPage({ params }: Props) {
  const link = await getCheckInData(params.token);

  if (!link) notFound();

  const { property, wifiName, wifiPassword, videoUrl } = link;
  const heroImage = property.images[0]?.url;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero image */}
      {heroImage && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={heroImage} alt={property.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Title + address */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-600 hover:underline text-sm"
          >
            <MapPin size={16} />
            {property.address}, {property.city}
          </a>
        </div>

        {/* Check-in instructions */}
        {property.checkInInfo && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
              <Info size={20} className="text-blue-500" /> Instrucțiuni check-in
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.checkInInfo}</p>
          </section>
        )}

        {/* Wi-Fi */}
        {(wifiName || wifiPassword) && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
              <Wifi size={20} className="text-green-500" /> Wi-Fi
            </h2>
            <div className="space-y-2">
              {wifiName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Rețea</span>
                  <span className="font-mono font-semibold">{wifiName}</span>
                </div>
              )}
              {wifiPassword && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Parolă</span>
                  <span className="font-mono font-semibold">{wifiPassword}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* House rules */}
        {property.houseRules && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
              <ShieldCheck size={20} className="text-purple-500" /> Reguli casă
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.houseRules}</p>
          </section>
        )}

        {/* Local tips */}
        {property.localTips && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
              <Lightbulb size={20} className="text-yellow-500" /> Recomandări locale
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.localTips}</p>
          </section>
        )}

        {/* Photo gallery */}
        {property.images.length > 1 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Fotografii</h2>
            <div className="grid grid-cols-2 gap-3">
              {property.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={`${property.title} ${i + 2}`}
                  className="w-full h-40 object-cover rounded-xl"
                />
              ))}
            </div>
          </section>
        )}

        {/* Video */}
        {videoUrl && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Video</h2>
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Host contact */}
        {property.host.phone && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
              <Phone size={20} className="text-gray-500" /> Contact gazdă
            </h2>
            <p className="text-gray-700">{property.host.name}</p>
            <a href={`tel:${property.host.phone}`} className="text-primary-600 font-medium hover:underline">
              {property.host.phone}
            </a>
          </section>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by{' '}
          <a href="/" className="hover:underline">
            Stai Aici
          </a>
        </p>
      </div>
    </div>
  );
}
