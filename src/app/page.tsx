import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Calendar, Link2, FileText, BarChart3, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { getSession } from '@/lib/auth';
import type { Lang } from '@/lib/i18n';
import { landingT } from '@/lib/i18n';

const FEATURE_ICONS = [Calendar, Link2, FileText, BarChart3];
const FEATURE_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-purple-400',
  'from-orange-500 to-amber-400',
];

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    const dest =
      session.role === 'ADMIN' ? '/dashboard/admin' :
      session.role === 'HOST'  ? '/dashboard/host'  :
                                 '/dashboard/guest/profile';
    redirect(dest);
  }

  const langCookie = cookies().get('nestly-lang')?.value;
  const lang: Lang = langCookie === 'en' ? 'en' : 'ro';
  const t = landingT[lang];

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section
        className="relative text-white py-28 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #042f2e 0%, #065f56 45%, #0d9488 100%)' }}
      >
        {/* decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* glow blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-primary-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <Zap size={13} className="text-yellow-300" />
            {lang === 'ro' ? '14 zile gratuit · Fără card' : '14-day free trial · No card required'}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
            {t.heroTitle.split(' ').slice(0, 4).join(' ')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #5eead4, #a5f3fc)' }}
            >
              {t.heroTitle.split(' ').slice(4).join(' ')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-teal-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 bg-white text-primary-800 hover:bg-teal-50 font-semibold text-lg px-8 py-3.5 rounded-xl transition shadow-lg shadow-black/20"
            >
              {t.heroStart}
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-lg px-8 py-3.5 rounded-xl transition backdrop-blur-sm"
            >
              {t.heroLogin}
            </Link>
          </div>

          {/* social proof strip */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-teal-200/70">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> {lang === 'ro' ? 'Fără comisioane' : 'No commissions'}</span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> {lang === 'ro' ? 'Date stocate în UE' : 'Data stored in the EU'}</span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-teal-400" /> {lang === 'ro' ? 'GDPR compliant' : 'GDPR compliant'}</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto py-24 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.featuresTitle}</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">{t.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            const grad = FEATURE_GRADIENTS[i];
            return (
              <div
                key={feature.title}
                className="group relative bg-white/80 rounded-2xl p-6 border border-gray-100/80 hover:border-primary-100 transition-all duration-300"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05), 0 16px 40px rgba(15,118,110,0.05)' }}
              >
                <div className={`bg-gradient-to-br ${grad} w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-md`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{t.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connecting line desktop */}
            <div className="hidden md:block absolute top-6 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />
            {t.steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-5 relative z-10 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: 'white', boxShadow: '0 4px 16px rgba(13,148,136,0.35)' }}
                >
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-5xl mx-auto py-24 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.pricingTitle}</h2>
          <p className="text-gray-500">{t.pricingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Free */}
          <div className="bg-white/80 rounded-2xl p-8 border border-gray-200/80" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <h3 className="font-bold text-xl mb-1">{t.plans[0].name}</h3>
            <p className="text-gray-400 text-sm mb-5">{t.plans[0].desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{t.plans[0].price}</span>
              <span className="text-gray-400 ml-1 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.plans[0].features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={15} className="text-gray-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-2.5 px-4 rounded-xl font-medium transition border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t.plans[0].cta}
            </Link>
          </div>

          {/* Starter — highlighted, taller */}
          <div
            className="relative rounded-2xl p-8 md:-my-4 md:py-12 text-white"
            style={{
              background: 'linear-gradient(145deg, #0d9488 0%, #065f56 100%)',
              boxShadow: '0 8px 40px rgba(13,148,136,0.45), 0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full shadow-sm">
              ★ {t.recommended}
            </span>
            <h3 className="font-bold text-xl mb-1">{t.plans[1].name}</h3>
            <p className="text-teal-200 text-sm mb-5">{t.plans[1].desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">{t.plans[1].price}</span>
              <span className="text-teal-300 ml-1 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.plans[1].features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-teal-50">
                  <CheckCircle size={15} className="text-teal-300 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-3 px-4 rounded-xl font-semibold transition bg-white text-primary-800 hover:bg-teal-50 shadow-md"
            >
              {t.plans[1].cta}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white/80 rounded-2xl p-8 border border-gray-200/80" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <h3 className="font-bold text-xl mb-1">{t.plans[2].name}</h3>
            <p className="text-gray-400 text-sm mb-5">{t.plans[2].desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{t.plans[2].price}</span>
              <span className="text-gray-400 ml-1 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.plans[2].features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={15} className="text-primary-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-2.5 px-4 rounded-xl font-medium transition bg-primary-600 text-white hover:bg-primary-700"
            >
              {t.plans[2].cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-8 py-16 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #042f2e 0%, #065f56 50%, #0d9488 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {lang === 'ro' ? 'Gata să simplifici tot?' : 'Ready to simplify everything?'}
            </h2>
            <p className="text-teal-200 mb-8 text-lg">
              {lang === 'ro' ? 'Configurare în 5 minute. Fără card.' : '5-minute setup. No card needed.'}
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-primary-800 hover:bg-teal-50 font-semibold text-lg px-8 py-3.5 rounded-xl transition shadow-lg shadow-black/20"
            >
              {t.heroStart} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
