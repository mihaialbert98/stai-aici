import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de cookies – StaiAici',
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politica de cookies</h1>
      <p className="text-sm text-gray-500 mb-8">Ultima actualizare: 1 februarie 2026</p>

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
          <p>StaiAici foloseste exclusiv cookie-uri esentiale necesare pentru functionarea platformei:</p>

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
                  <td className="px-4 py-2 border-b"><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">stai-aici-token</code></td>
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
            In prezent, StaiAici nu foloseste cookie-uri de la terti (analytics, publicitate, retele sociale).
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
            Email: contact@staiaici.ro
          </p>
        </section>
      </div>
    </div>
  );
}
