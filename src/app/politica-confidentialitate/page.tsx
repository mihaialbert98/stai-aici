'use client';

import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function PrivacyPolicyPage() {
  const lang = useLang();
  const lastUpdated = dashboardT[lang].footer.lastUpdated;

  if (lang === 'en') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              The Nestly platform is operated by <strong>ABT SOFTWARE HUB SRL</strong> (hereinafter referred to as &quot;the Controller&quot;).
              Protecting your personal data is a priority for us. This policy describes how we collect, use and protect your data
              in accordance with the General Data Protection Regulation (GDPR) — Regulation (EU) 2016/679.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. What data we collect</h2>
            <p>Depending on how you use the platform, we may collect the following categories of data:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Identification data:</strong> first name, last name, email address</li>
              <li><strong>Authentication data:</strong> password (stored encrypted)</li>
              <li><strong>Booking data:</strong> check-in/check-out dates, number of guests, total price</li>
              <li><strong>Communication data:</strong> messages exchanged between guests and hosts via the platform</li>
              <li><strong>Review data:</strong> ratings and comments about properties</li>
              <li><strong>Technical data:</strong> session cookies for authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Purpose of data processing</h2>
            <p>We process your data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Creating and managing your user account</li>
              <li>Processing and managing accommodation bookings</li>
              <li>Communication between guests and hosts</li>
              <li>Sending relevant notifications (bookings, messages, reviews)</li>
              <li>Sending transactional emails (booking confirmation, review reminder)</li>
              <li>Platform administration by our team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Legal basis for processing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Performance of a contract</strong> — for account management and booking processing (Art. 6(1)(b) GDPR)</li>
              <li><strong>Consent</strong> — for sending promotional communications where applicable (Art. 6(1)(a) GDPR)</li>
              <li><strong>Legitimate interest</strong> — for platform improvement and fraud prevention (Art. 6(1)(f) GDPR)</li>
              <li><strong>Legal obligation</strong> — for compliance with applicable legislation (Art. 6(1)(c) GDPR)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data retention period</h2>
            <p>
              Your data is retained for the duration of your account and for a maximum of 3 years from the last activity.
              Booking data is retained in accordance with applicable fiscal obligations.
              You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your rights</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Right of access</strong> — you may request a copy of the data we hold about you</li>
              <li><strong>Right to rectification</strong> — you may request correction of inaccurate data</li>
              <li><strong>Right to erasure</strong> — you may request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Right to data portability</strong> — you may receive your data in a structured format</li>
              <li><strong>Right to object</strong> — you may object to the processing of your data in certain situations</li>
              <li><strong>Right to lodge a complaint</strong> — with the National Supervisory Authority for Personal Data Processing (ANSPDCP)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your data, including:
              password encryption, secure connections (HTTPS), access controls and secure information storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              We use one essential session cookie (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">nestly-token</code>) required
              for authentication on the platform. For full details, see our <a href="/cookies" className="text-primary-600 underline">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>For any questions or requests regarding your personal data, you can contact us at:</p>
            <p className="mt-2">
              <strong>ABT SOFTWARE HUB SRL</strong><br />
              Email: contact@nestly.app
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politica de confidentialitate</h1>
      <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Cine suntem</h2>
          <p>
            Platforma Nestly este operata de <strong>ABT SOFTWARE HUB SRL</strong> (denumita in continuare &quot;Operatorul&quot;).
            Protejarea datelor dumneavoastra cu caracter personal este o prioritate pentru noi. Aceasta politica descrie modul in care
            colectam, utilizam si protejam datele dumneavoastra in conformitate cu Regulamentul General privind Protectia Datelor (GDPR)
            — Regulamentul (UE) 2016/679.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Ce date colectam</h2>
          <p>In functie de modul in care utilizati platforma, putem colecta urmatoarele categorii de date:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Date de identificare:</strong> nume, prenume, adresa de email</li>
            <li><strong>Date de autentificare:</strong> parola (stocata criptat)</li>
            <li><strong>Date de rezervare:</strong> datele de check-in/check-out, numarul de oaspeti, pretul total</li>
            <li><strong>Date de comunicare:</strong> mesajele schimbate intre oaspeti si gazde prin platforma</li>
            <li><strong>Date de recenzie:</strong> rating-uri si comentarii despre proprietati</li>
            <li><strong>Date tehnice:</strong> cookie-uri de sesiune pentru autentificare</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Scopul prelucrarii datelor</h2>
          <p>Prelucram datele dumneavoastra in urmatoarele scopuri:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Crearea si gestionarea contului de utilizator</li>
            <li>Procesarea si gestionarea rezervarilor de cazare</li>
            <li>Comunicarea intre oaspeti si gazde</li>
            <li>Trimiterea notificarilor relevante (rezervari, mesaje, recenzii)</li>
            <li>Trimiterea de email-uri tranzactionale (confirmare rezervare, reminder recenzie)</li>
            <li>Administrarea platformei de catre echipa noastra</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Temeiul legal al prelucrarii</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Executarea contractului</strong> — pentru gestionarea contului si procesarea rezervarilor (Art. 6(1)(b) GDPR)</li>
            <li><strong>Consimtamant</strong> — pentru trimiterea de comunicari promotionale, daca este cazul (Art. 6(1)(a) GDPR)</li>
            <li><strong>Interesul legitim</strong> — pentru imbunatatirea platformei si prevenirea fraudelor (Art. 6(1)(f) GDPR)</li>
            <li><strong>Obligatii legale</strong> — pentru conformarea cu legislatia in vigoare (Art. 6(1)(c) GDPR)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Durata pastrarii datelor</h2>
          <p>
            Datele dumneavoastra sunt pastrate pe durata existentei contului si pentru o perioada de maximum 3 ani
            de la ultima activitate. Datele de rezervare sunt pastrate conform obligatiilor fiscale aplicabile.
            Puteti solicita stergerea contului si a datelor asociate in orice moment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Drepturile dumneavoastra</h2>
          <p>In conformitate cu GDPR, aveti urmatoarele drepturi:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Dreptul de acces</strong> — puteti solicita o copie a datelor pe care le detinem despre dumneavoastra</li>
            <li><strong>Dreptul la rectificare</strong> — puteti cere corectarea datelor inexacte</li>
            <li><strong>Dreptul la stergere</strong> — puteti solicita stergerea datelor (&quot;dreptul de a fi uitat&quot;)</li>
            <li><strong>Dreptul la portabilitatea datelor</strong> — puteti primi datele intr-un format structurat</li>
            <li><strong>Dreptul la opozitie</strong> — va puteti opune prelucrarii datelor in anumite situatii</li>
            <li><strong>Dreptul de a depune o plangere</strong> — la Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal (ANSPDCP)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Securitatea datelor</h2>
          <p>
            Implementam masuri tehnice si organizatorice adecvate pentru protectia datelor, inclusiv:
            criptarea parolelor, conexiuni securizate (HTTPS), controlul accesului la date si
            stocarea securizata a informatiilor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookie-uri</h2>
          <p>
            Folosim un cookie esential de sesiune (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">nestly-token</code>) necesar
            pentru autentificarea pe platforma. Pentru detalii complete, consultati <a href="/cookies" className="text-primary-600 underline">Politica de cookies</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact</h2>
          <p>
            Pentru orice intrebari sau solicitari privind datele dumneavoastra personale, ne puteti contacta la:
          </p>
          <p className="mt-2">
            <strong>ABT SOFTWARE HUB SRL</strong><br />
            Email: contact@nestly.app
          </p>
        </section>
      </div>
    </div>
  );
}
