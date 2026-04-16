'use client';

import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function CookiePolicyPage() {
  const lang = useLang();
  const lastUpdated = dashboardT[lang].footer.lastUpdated;

  if (lang === 'en') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Cookie policy</h1>
        <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device by your web browser when you visit a website.
              They are widely used to make websites work correctly and to provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Cookies we use</h2>
            <p>StayBird uses only essential cookies required for the platform to function:</p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 border-b font-medium">Name</th>
                    <th className="text-left px-4 py-2 border-b font-medium">Purpose</th>
                    <th className="text-left px-4 py-2 border-b font-medium">Duration</th>
                    <th className="text-left px-4 py-2 border-b font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b"><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">staybird-token</code></td>
                    <td className="px-4 py-2 border-b">User authentication (JWT session)</td>
                    <td className="px-4 py-2 border-b">7 days</td>
                    <td className="px-4 py-2 border-b">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">cookie-consent</code></td>
                    <td className="px-4 py-2">Stores cookie consent (localStorage)</td>
                    <td className="px-4 py-2">Unlimited</td>
                    <td className="px-4 py-2">Essential</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Third-party cookies</h2>
            <p>
              Currently, StayBird does not use any third-party cookies (analytics, advertising, social networks).
              If this changes in the future, we will update this policy and request your consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. How to manage cookies</h2>
            <p>
              You can configure your browser to refuse or delete cookies. Please note that disabling the authentication
              cookie will prevent you from using your account on the platform.
            </p>
            <p className="mt-2">Instructions for major browsers:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &gt; Cookies</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies</li>
              <li><strong>Edge:</strong> Settings &gt; Privacy &gt; Cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Contact</h2>
            <p>For questions about the cookies used on the platform, contact us at:</p>
            <p className="mt-2">
              <strong>ABT SOFTWARE HUB SRL</strong><br />
              Email: contact@stayviara.com
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politica de cookies</h1>
      <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Ce sunt cookie-urile?</h2>
          <p>
            Cookie-urile sunt fisiere text mici stocate pe dispozitivul dumneavoastra de catre browser-ul web
            atunci cand vizitati un site. Ele sunt folosite pe scara larga pentru a face site-urile sa functioneze
            corect si pentru a furniza informatii proprietarilor site-ului.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Cookie-urile pe care le folosim</h2>
          <p>StayBird foloseste exclusiv cookie-uri esentiale necesare pentru functionarea platformei:</p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 border-b font-medium">Nume</th>
                  <th className="text-left px-4 py-2 border-b font-medium">Scop</th>
                  <th className="text-left px-4 py-2 border-b font-medium">Durata</th>
                  <th className="text-left px-4 py-2 border-b font-medium">Tip</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b"><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">staybird-token</code></td>
                  <td className="px-4 py-2 border-b">Autentificarea utilizatorului (sesiune JWT)</td>
                  <td className="px-4 py-2 border-b">7 zile</td>
                  <td className="px-4 py-2 border-b">Esential</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">cookie-consent</code></td>
                  <td className="px-4 py-2">Stocheaza acceptul pentru cookie-uri (localStorage)</td>
                  <td className="px-4 py-2">Nelimitat</td>
                  <td className="px-4 py-2">Esential</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Cookie-uri terte</h2>
          <p>
            In prezent, StayBird nu foloseste cookie-uri de la terti (analytics, publicitate, retele sociale).
            Daca acest lucru se va schimba in viitor, vom actualiza aceasta politica si vom solicita
            consimtamantul dumneavoastra.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Cum puteti gestiona cookie-urile</h2>
          <p>
            Puteti configura browser-ul sa refuze sau sa stearga cookie-urile. Retineti ca dezactivarea
            cookie-ului de autentificare va impiedica utilizarea contului pe platforma.
          </p>
          <p className="mt-2">Instructiuni pentru browser-ele principale:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Chrome:</strong> Setari &gt; Confidentialitate si securitate &gt; Cookie-uri</li>
            <li><strong>Firefox:</strong> Setari &gt; Confidentialitate &gt; Cookie-uri</li>
            <li><strong>Safari:</strong> Preferinte &gt; Confidentialitate &gt; Cookie-uri</li>
            <li><strong>Edge:</strong> Setari &gt; Confidentialitate &gt; Cookie-uri</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Contact</h2>
          <p>
            Pentru intrebari despre cookie-urile folosite pe platforma, contactati-ne la:
          </p>
          <p className="mt-2">
            <strong>ABT SOFTWARE HUB SRL</strong><br />
            Email: contact@stayviara.com
          </p>
        </section>
      </div>
    </div>
  );
}
