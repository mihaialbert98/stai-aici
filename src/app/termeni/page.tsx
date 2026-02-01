import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termeni si conditii – StaiAici',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Termeni si conditii</h1>
      <p className="text-sm text-gray-500 mb-8">Ultima actualizare: 1 februarie 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Descrierea platformei</h2>
          <p>
            StaiAici este o platforma online de intermediere intre gazde care ofera cazare si oaspeti care cauta
            cazare in Romania. Platforma este operata de <strong>ABT SOFTWARE HUB SRL</strong>.
            StaiAici actioneaza exclusiv ca intermediar si nu este parte in contractul de cazare dintre gazda si oaspete.
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
            Plata se face direct intre oaspete si gazda, StaiAici nefiind implicat in tranzactia financiara.
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
            StaiAici actioneaza ca intermediar si nu garanteaza calitatea cazarii, acuratetea informatiilor
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
            Continutul platformei StaiAici (design, cod sursa, texte, logo) este proprietatea ABT SOFTWARE HUB SRL
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
            Email: contact@staiaici.ro
          </p>
        </section>
      </div>
    </div>
  );
}
