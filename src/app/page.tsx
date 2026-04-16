import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Calendar, Link2, FileText, BarChart3, CheckCircle, ArrowRight, Zap, Clock } from 'lucide-react';
import { getSession } from '@/lib/auth';
import type { Lang } from '@/lib/i18n';
import { landingT } from '@/lib/i18n';

const FEATURE_ICONS = [Calendar, Link2, FileText, BarChart3];
const FEATURE_COLORS = [
  { bg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/15' },
  { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', border: 'border-emerald-500/15' },
  { bg: 'bg-violet-500/10', icon: 'text-violet-500', border: 'border-violet-500/15' },
  { bg: 'bg-orange-500/10', icon: 'text-orange-500', border: 'border-orange-500/15' },
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

  const langCookie = cookies().get('staybird-lang')?.value;
  const lang: Lang = langCookie === 'en' ? 'en' : 'ro';
  const t = landingT[lang];

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section
        className="relative text-white py-32 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #021a19 0%, #042f2e 30%, #065f56 65%, #0d9488 100%)' }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Layered glow blobs */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.10] blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }}
        />
        {/* Diagonal accent line */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px opacity-[0.12]"
          style={{ background: 'linear-gradient(180deg, transparent, #5eead4 40%, transparent)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.15] text-teal-200 text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Zap size={12} className="text-yellow-300" fill="currentColor" />
            {lang === 'ro' ? '14 zile gratuit · Fără card de credit' : '14-day free trial · No credit card'}
          </div>

          <h1
            className="font-black mb-7 leading-[1.05] tracking-tight"
            style={{ fontSize: 'clamp(2.75rem, 7vw, 5rem)' }}
          >
            {t.heroTitle.split(' ').slice(0, 4).join(' ')}{' '}
            <span
              className="bg-clip-text text-transparent inline-block"
              style={{ backgroundImage: 'linear-gradient(90deg, #34d399 0%, #5eead4 50%, #a5f3fc 100%)' }}
            >
              {t.heroTitle.split(' ').slice(4).join(' ')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-teal-100/70 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2.5 bg-white text-primary-900 hover:bg-teal-50 font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-black/25 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.heroStart}
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center border border-white/25 text-white/90 hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              {t.heroLogin}
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-teal-200/60">
            <span className="flex items-center gap-2">
              <CheckCircle size={14} className="text-teal-400/80" />
              {lang === 'ro' ? 'Fără comisioane per rezervare' : 'No per-booking commissions'}
            </span>
            <span className="hidden sm:block w-px h-3.5 bg-white/15" />
            <span className="flex items-center gap-2">
              <CheckCircle size={14} className="text-teal-400/80" />
              {lang === 'ro' ? 'Date stocate în UE' : 'EU data storage'}
            </span>
            <span className="hidden sm:block w-px h-3.5 bg-white/15" />
            <span className="flex items-center gap-2">
              <CheckCircle size={14} className="text-teal-400/80" />
              GDPR compliant
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto py-28 px-4">
        <div className="text-center mb-16">
          <h2
            className="font-bold mb-4 tracking-tight text-gray-900"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            {t.featuresTitle}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">{t.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {t.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            const colors = FEATURE_COLORS[i];
            return (
              <div
                key={feature.title}
                className={`group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(15,118,110,0.04)' }}
              >
                <div className={`${colors.bg} border ${colors.border} w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[0.95rem]">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-4" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-bold text-center mb-16 tracking-tight text-gray-900"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            {t.howTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative mt-14">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-7 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
              style={{ background: 'linear-gradient(90deg, #99f6e4, #0d9488, #99f6e4)' }}
            />
            {t.steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-6 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(13,148,136,0.35), 0 0 0 4px rgba(13,148,136,0.1)',
                  }}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-5xl mx-auto py-28 px-4">
        <div className="text-center mb-16">
          <h2
            className="font-bold mb-4 tracking-tight text-gray-900"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            {t.pricingTitle}
          </h2>
          <p className="text-gray-500 text-base">{t.pricingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mt-14">
          {/* Free */}
          <div
            className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="mb-6">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{t.plans[0].name}</h3>
              <p className="text-gray-400 text-sm">{t.plans[0].desc}</p>
            </div>
            <div className="mb-7">
              <span className="text-4xl font-black text-gray-900">{t.plans[0].price}</span>
              <span className="text-gray-400 ml-1.5 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {t.plans[0].features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle size={15} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-150 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99]"
            >
              {t.plans[0].cta}
            </Link>
          </div>

          {/* Starter — highlighted */}
          <div
            className="relative rounded-2xl p-8 md:-my-5 md:py-12 text-white flex flex-col"
            style={{
              background: 'linear-gradient(150deg, #0f766e 0%, #065f56 60%, #042f2e 100%)',
              boxShadow: '0 8px 48px rgba(13,148,136,0.4), 0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 text-xs font-black px-5 py-1.5 rounded-full shadow-lg tracking-wide uppercase"
            >
              ★ {t.recommended}
            </span>
            <div className="mb-6">
              <h3 className="font-bold text-xl text-white mb-1">{t.plans[1].name}</h3>
              <p className="text-teal-300/80 text-sm">{t.plans[1].desc}</p>
            </div>
            <div className="mb-7">
              <span className="text-4xl font-black">{t.plans[1].price}</span>
              <span className="text-teal-300/70 ml-1.5 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {t.plans[1].features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-teal-50">
                  <CheckCircle size={15} className="text-teal-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-3 px-4 rounded-xl font-bold text-sm transition-all duration-150 bg-white text-primary-900 hover:bg-teal-50 shadow-lg shadow-black/20 active:scale-[0.99]"
            >
              {t.plans[1].cta}
            </Link>
          </div>

          {/* Pro */}
          <div
            className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="mb-6">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{t.plans[2].name}</h3>
              <p className="text-gray-400 text-sm">{t.plans[2].desc}</p>
            </div>
            <div className="mb-7">
              <span className="text-4xl font-black text-gray-900">{t.plans[2].price}</span>
              <span className="text-gray-400 ml-1.5 text-sm">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {t.plans[2].features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle size={15} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="block text-center py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-600/20 active:scale-[0.99]"
            >
              {t.plans[2].cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Coming soon / Roadmap ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              <Clock size={12} /> {lang === 'ro' ? 'Roadmap' : 'Roadmap'}
            </div>
            <h2
              className="font-bold mb-3 tracking-tight text-gray-900"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              {t.comingSoonTitle}
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t.comingSoonSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.comingSoon.map((item) => (
              <div
                key={item.title}
                className="relative bg-white/60 rounded-2xl p-6 border border-dashed border-gray-200 hover:border-gray-300 hover:bg-white/90 transition-all duration-200"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide">
                  <Clock size={10} /> {lang === 'ro' ? 'În curând' : 'Coming soon'}
                </span>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-[0.95rem]">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-8 py-20 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #021a19 0%, #042f2e 35%, #065f56 70%, #0d9488 100%)' }}
        >
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Glow */}
          <div
            className="absolute top-0 right-0 w-80 h-80 opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #2dd4bf, transparent 70%)' }}
          />
          <div className="relative">
            <h2
              className="font-black mb-4 tracking-tight"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              {lang === 'ro' ? 'Gata să simplifici tot?' : 'Ready to simplify everything?'}
            </h2>
            <p className="text-teal-200/70 mb-10 text-lg font-light">
              {lang === 'ro' ? 'Configurare în 5 minute. Fără card.' : '5-minute setup. No card needed.'}
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2.5 bg-white text-primary-900 hover:bg-teal-50 font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-black/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.heroStart} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
