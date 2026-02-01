import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de confidentialitate – StaiAici',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politica de confidentialitate</h1>
      <p className="text-sm text-gray-500 mb-8">Ultima actualizare: 1 februarie 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Cine suntem</h2>
          <p>
            Platforma StaiAici este operata de <strong>ABT SOFTWARE HUB SRL</strong> (denumita in continuare &quot;Operatorul&quot;).
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
            Folosim un cookie esential de sesiune (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">stai-aici-token</code>) necesar
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
            Email: contact@staiaici.ro
          </p>
        </section>
      </div>
    </div>
  );
}
