'use client';

import { MessagesList } from '@/components/MessagesList';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function HostMessagesPage() {
  const lang = useLang();
  const t = dashboardT[lang].messages;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      <MessagesList role="host" />
    </div>
  );
}
