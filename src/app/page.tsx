import Link from 'next/link';
import { Calendar, Link2, FileText, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Gestionează-ți proprietățile Airbnb și Booking.com dintr-un singur loc
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Sincronizează calendarele, trimite link-uri de check-in profesionale și colectează fișele de cazare digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold text-lg px-8 py-3 rounded-lg transition"
            >
              Începe gratuit
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white text-white hover:bg-primary-700 font-semibold text-lg px-8 py-3 rounded-lg transition"
            >
              Autentifică-te
            </Link>
          </div>
          <p className="text-primary-200 text-sm mt-4">14 zile gratuit pe Starter, fără card</p>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Tot ce ai nevoie pentru a gestiona proprietățile tale</h2>
        <p className="text-center text-gray-500 mb-14 text-lg">O platformă completă pentru gazde din România</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            {
              icon: Calendar,
              title: 'Calendare sincronizate',
              desc: 'Importă automat rezervările de pe Airbnb și Booking.com prin iCal.',
              color: 'text-blue-500',
              bg: 'bg-blue-50',
            },
            {
              icon: Link2,
              title: 'Link de check-in',
              desc: 'Generează un link profesional cu instrucțiuni, WiFi și reguli pentru oaspeți.',
              color: 'text-green-500',
              bg: 'bg-green-50',
            },
            {
              icon: FileText,
              title: 'Fișă de cazare digitală',
              desc: 'Colectează datele oaspeților conform legislației române, fără hârtie.',
              color: 'text-purple-500',
              bg: 'bg-purple-50',
            },
            {
              icon: BarChart3,
              title: 'Statistici unificate',
              desc: 'Venituri, ocupare și evaluări pentru toate proprietățile tale într-un singur dashboard.',
              color: 'text-orange-500',
              bg: 'bg-orange-50',
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="text-center">
              <div className={`${bg} ${color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon size={28} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">Cum funcționează</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '1',
                title: 'Adaugă proprietatea',
                desc: 'Creează profilul proprietății cu fotografii, descriere, facilități și prețuri.',
              },
              {
                step: '2',
                title: 'Sincronizează calendarul',
                desc: 'Conectează Airbnb și Booking.com prin link-ul iCal pentru a importa rezervările automat.',
              },
              {
                step: '3',
                title: 'Trimite link-ul de check-in',
                desc: 'Generează și trimite link-ul personalizat oaspeților pe WhatsApp sau prin platforme.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Prețuri clare, fără surprize</h2>
        <p className="text-center text-gray-500 mb-14">14 zile gratuit pe Starter, fără card necesar</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Free',
              price: '0 RON',
              desc: 'Pentru gazde la început de drum',
              features: ['1 proprietate', 'Sincronizare iCal', 'Rezervări și mesaje', 'Link de check-in', 'Dashboard statistici'],
              cta: 'Începe gratuit',
              ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition border border-primary-600 text-primary-600 hover:bg-primary-50',
              highlight: false,
            },
            {
              name: 'Starter',
              price: '49 RON',
              desc: 'Pentru gazde în creștere',
              features: ['Până la 5 proprietăți', 'Tot din Free', 'Fișe de cazare digitale', 'Prețuri pe perioade', 'Export CSV'],
              cta: 'Începe trial gratuit',
              ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition bg-primary-600 text-white hover:bg-primary-700',
              highlight: true,
            },
            {
              name: 'Pro',
              price: '129 RON',
              desc: 'Pentru profesioniști',
              features: ['Proprietăți nelimitate', 'Tot din Starter', 'Export PDF', 'Suport prioritar', 'Analytics avansat'],
              cta: 'Alege Pro',
              ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition border border-primary-600 text-primary-600 hover:bg-primary-50',
              highlight: false,
            },
          ].map(({ name, price, desc, features, cta, ctaStyle, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl p-8 border relative ${
                highlight ? 'border-primary-500 shadow-xl ring-2 ring-primary-100' : 'border-gray-200'
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recomandat
                </span>
              )}
              <h3 className="font-bold text-xl mb-1">{name}</h3>
              <p className="text-gray-500 text-sm mb-4">{desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-gray-400 ml-1">/lună</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className={ctaStyle}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary marketplace link */}
      <section className="border-t border-gray-100 py-12 px-4 text-center bg-gray-50">
        <p className="text-gray-500 mb-2">Cauți o cazare în România?</p>
        <Link href="/search" className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1">
          Caută cazări disponibile <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
