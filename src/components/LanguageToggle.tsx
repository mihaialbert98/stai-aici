import type { Lang } from '@/lib/i18n';

interface StateProps {
  current: Lang;
  onChange: (lang: Lang) => void;
}

/** State-based toggle — use on client pages (form page) */
export function LanguageToggle({ current, onChange }: StateProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
      {(['ro', 'en'] as const).map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`px-3 py-1.5 transition ${
            current === lang
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

interface LinkProps {
  current: Lang;
  baseUrl: string; // e.g. "/checkin/abc123"
}

/** Link-based toggle — use on server pages (check-in page) */
export function LanguageToggleLinks({ current, baseUrl }: LinkProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
      {(['ro', 'en'] as const).map(lang => (
        <a
          key={lang}
          href={`${baseUrl}?lang=${lang}`}
          className={`px-3 py-1.5 transition ${
            current === lang
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {lang.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
