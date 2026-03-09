import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Calendar, Link2, FileText, BarChart3, CheckCircle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import type { Lang } from '@/lib/i18n';
import { landingT } from '@/lib/i18n';

const PLAN_META = [
  { ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition border border-primary-600 text-primary-600 hover:bg-primary-50', highlight: false },
  { ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition bg-primary-600 text-white hover:bg-primary-700', highlight: true },
  { ctaStyle: 'block text-center py-2.5 px-4 rounded-lg font-medium transition border border-primary-600 text-primary-600 hover:bg-primary-50', highlight: false },
];

const FEATURE_ICONS = [Calendar, Link2, FileText, BarChart3];
const FEATURE_COLORS = [
  { color: 'text-blue-500', bg: 'bg-blue-50' },
  { color: 'text-green-500', bg: 'bg-green-50' },
  { color: 'text-purple-500', bg: 'bg-purple-50' },
  { color: 'text-orange-500', bg: 'bg-orange-50' },
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold text-lg px-8 py-3 rounded-lg transition"
            >
              {t.heroStart}
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white text-white hover:bg-primary-700 font-semibold text-lg px-8 py-3 rounded-lg transition"
            >
              {t.heroLogin}
            </Link>
          </div>
          <p className="text-primary-200 text-sm mt-4">{t.heroTrial}</p>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-4">{t.featuresTitle}</h2>
        <p className="text-center text-gray-500 mb-14 text-lg">{t.featuresSubtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {t.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            const { color, bg } = FEATURE_COLORS[i];
            return (
              <div key={feature.title} className="text-center">
                <div className={`${bg} ${color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={28} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">{t.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {t.steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-4">{t.pricingTitle}</h2>
        <p className="text-center text-gray-500 mb-14">{t.pricingSubtitle}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.plans.map((plan, i) => {
            const { ctaStyle, highlight } = PLAN_META[i];
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border relative ${
                  highlight ? 'border-primary-500 shadow-xl ring-2 ring-primary-100' : 'border-gray-200'
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t.recommended}
                  </span>
                )}
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{t.perMonth}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={ctaStyle}>
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
