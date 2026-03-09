'use client';

import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function TermsPage() {
  const lang = useLang();
  const lastUpdated = dashboardT[lang].footer.lastUpdated;

  if (lang === 'en') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms and conditions</h1>
        <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Platform description</h2>
            <p>
              Nestly is an online platform intermediating between hosts offering accommodation and guests seeking
              accommodation in Romania. The platform is operated by <strong>ABT SOFTWARE HUB SRL</strong>.
              Nestly acts solely as an intermediary and is not a party to the accommodation contract between the host and the guest.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Account registration</h2>
            <p>To use the platform, you must create an account by providing real and complete information. You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>The accuracy of the information provided</li>
              <li>The security of your password and account</li>
              <li>All activities carried out through your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Host obligations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and up-to-date information about listed properties</li>
              <li>Maintain an up-to-date availability calendar</li>
              <li>Respond promptly to booking requests</li>
              <li>Ensure the accommodation conditions promised in the platform listing</li>
              <li>Comply with applicable legislation regarding tourist accommodation</li>
              <li>Hold all authorisations required to operate as an accommodation unit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Guest obligations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide real contact information when making a booking</li>
              <li>Respect the house rules set by the host</li>
              <li>Treat the property with care and report any issues</li>
              <li>Arrive for check-in as scheduled or notify the host in case of delay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Bookings and cancellations</h2>
            <p>
              Bookings are requested by guests and require explicit confirmation from the host. A booking becomes
              effective only after acceptance by the host. Both parties may cancel a booking. Specific cancellation
              conditions are set by each host individually.
            </p>
            <p className="mt-2">
              Payment is made directly between the guest and the host; Nestly is not involved in the financial transaction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Reviews</h2>
            <p>
              Guests may leave reviews after completing their stay. Reviews must reflect the genuine experience and must not
              contain offensive language, false information or illegal content. We reserve the right to remove reviews
              that violate these rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of liability</h2>
            <p>
              Nestly acts as an intermediary and does not guarantee the quality of accommodation, the accuracy of
              information provided by hosts, or the availability of properties. We are not responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Direct or indirect damages resulting from use of the platform</li>
              <li>Disputes between hosts and guests</li>
              <li>Temporary unavailability of the platform</li>
              <li>Losses resulting from unauthorised access to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Intellectual property</h2>
            <p>
              The content of the Nestly platform (design, source code, text, logo) is the property of ABT SOFTWARE HUB SRL
              and is protected by copyright law. Property photographs belong to the hosts who uploaded them and are used with their consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Account suspension</h2>
            <p>
              We reserve the right to suspend or deactivate accounts that violate these terms, that are used fraudulently,
              or that receive repeated complaints from other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Applicable law</h2>
            <p>
              These terms are governed by Romanian law. Any dispute will be resolved amicably or, failing agreement,
              by the competent courts of Romania.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
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
      <h1 className="text-3xl font-bold mb-8">Termeni si conditii</h1>
      <p className="text-sm text-gray-500 mb-8">{lastUpdated}</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Descrierea platformei</h2>
          <p>
            Nestly este o platforma online de intermediere intre gazde care ofera cazare si oaspeti care cauta
            cazare in Romania. Platforma este operata de <strong>ABT SOFTWARE HUB SRL</strong>.
            Nestly actioneaza exclusiv ca intermediar si nu este parte in contractul de cazare dintre gazda si oaspete.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Inregistrarea contului</h2>
          <p>Pentru a utiliza platforma, trebuie sa va creati un cont furnizand informatii reale si complete. Sunteti responsabil pentru:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Acuratetea informatiilor furnizate</li>
            <li>Securitatea parolei si a contului</li>
            <li>Toate activitatile desfasurate prin contul dumneavoastra</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Obligatiile gazdelor</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sa furnizeze informatii corecte si actualizate despre proprietatile listate</li>
            <li>Sa mentina un calendar de disponibilitate actualizat</li>
            <li>Sa raspunda in timp util la cererile de rezervare</li>
            <li>Sa asigure conditiile de cazare promise in anuntul de pe platforma</li>
            <li>Sa respecte legislatia aplicabila in materie de cazare turistica</li>
            <li>Sa detina toate autorizatiile necesare functionarii ca unitate de cazare</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Obligatiile oaspetilor</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sa furnizeze informatii de contact reale la efectuarea rezervarii</li>
            <li>Sa respecte regulile casei stabilite de gazda</li>
            <li>Sa trateze proprietatea cu respect si sa semnaleze eventualele probleme</li>
            <li>Sa se prezinte la check-in conform programului stabilit sau sa anunte gazda in caz de intarziere</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Rezervari si anulari</h2>
          <p>
            Rezervarile sunt solicitate de oaspeti si necesita confirmarea explicita a gazdei. Rezervarea devine
            efectiva doar dupa acceptarea de catre gazda. Ambele parti pot anula o rezervare. Conditiile
            specifice de anulare sunt stabilite de fiecare gazda in parte.
          </p>
          <p className="mt-2">
            Plata se face direct intre oaspete si gazda, Nestly nefiind implicat in tranzactia financiara.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Recenzii</h2>
          <p>
            Oaspetii pot lasa recenzii dupa finalizarea sejurului. Recenziile trebuie sa reflecte experienta
            reala si sa nu contina limbaj ofensator, informatii false sau continut ilegal. Ne rezervam dreptul
            de a elimina recenziile care incalca aceste reguli.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitarea raspunderii</h2>
          <p>
            Nestly actioneaza ca intermediar si nu garanteaza calitatea cazarii, acuratetea informatiilor
            furnizate de gazde sau disponibilitatea proprietatilor. Nu suntem responsabili pentru:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Daune directe sau indirecte rezultate din utilizarea platformei</li>
            <li>Disputele dintre gazde si oaspeti</li>
            <li>Indisponibilitatea temporara a platformei</li>
            <li>Pierderi rezultate din accesul neautorizat la contul dumneavoastra</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Proprietate intelectuala</h2>
          <p>
            Continutul platformei Nestly (design, cod sursa, texte, logo) este proprietatea ABT SOFTWARE HUB SRL
            si este protejat de legislatia privind drepturile de autor. Fotografiile proprietatilor apartin gazdelor
            care le-au incarcat si sunt utilizate cu acordul acestora.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Suspendarea contului</h2>
          <p>
            Ne rezervam dreptul de a suspenda sau dezactiva conturile care incalca acesti termeni, care sunt
            utilizate in mod fraudulos sau care primesc plangeri repetate de la alti utilizatori.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Legislatie aplicabila</h2>
          <p>
            Acesti termeni sunt guvernati de legislatia din Romania. Orice disputa va fi solutionata pe cale
            amiabila sau, in lipsa unui acord, de catre instantele competente din Romania.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
          <p>
            <strong>ABT SOFTWARE HUB SRL</strong><br />
            Email: contact@nestly.app
          </p>
        </section>
      </div>
    </div>
  );
}
