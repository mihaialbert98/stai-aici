'use client';

import { useEffect, useState } from 'react';
import type { Lang } from './i18n';
import { getLangCookie } from './i18n';

const LANG_EVENT = 'nestly-lang-change';

/** Dispatch this after writing the cookie so all useLang() hooks update. */
export function dispatchLangChange(lang: Lang) {
  window.dispatchEvent(new CustomEvent<Lang>(LANG_EVENT, { detail: lang }));
}

/**
 * Read the global language preference.
 * Updates immediately when dispatchLangChange() is called anywhere on the page.
 */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>('ro');

  useEffect(() => {
    setLang(getLangCookie());

    const handler = (e: Event) => setLang((e as CustomEvent<Lang>).detail);
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  return lang;
}
