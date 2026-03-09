'use client';

import Link from 'next/link';
import { NestlyLogo } from '@/components/NestlyLogo';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export function Footer() {
  const lang = useLang();
  const t = dashboardT[lang].footer;

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-primary-700 inline-block">
              <NestlyLogo />
            </Link>
            <p className="text-sm text-gray-500 mt-2">{t.tagline}</p>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/politica-confidentialitate" className="text-gray-500 hover:text-primary-600 transition">
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/termeni" className="text-gray-500 hover:text-primary-600 transition">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-500 hover:text-primary-600 transition">
                  {t.cookies}
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Nestly. {t.allRightsReserved}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t.madeBy} <span className="font-medium text-gray-500">ABT SOFTWARE HUB SRL</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
