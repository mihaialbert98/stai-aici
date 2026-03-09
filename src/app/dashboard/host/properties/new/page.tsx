'use client';

import { PropertyForm } from '@/components/PropertyForm';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function NewPropertyPage() {
  const lang = useLang();
  const t = dashboardT[lang].properties;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.newTitle}</h1>
      <PropertyForm />
    </div>
  );
}
