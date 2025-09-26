"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Terug</span>
          </button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Algemene Voorwaarden</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Algemene Voorwaarden
          </h1>
          <p className="text-muted-foreground">
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Definities</h2>
              <p className="text-muted-foreground leading-relaxed">
                In deze voorwaarden wordt verstaan onder:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>MonnieGift:</strong> de dienst voor het versturen van geldcadeaus</li>
                <li><strong>Gebruiker:</strong> de persoon die een gift verstuurt</li>
                <li><strong>Ontvanger:</strong> de persoon die de gift ontvangt</li>
                <li><strong>Gift:</strong> het geldbedrag dat wordt verstuurd</li>
                <li><strong>Service fee:</strong> de vaste vergoeding van €0,99 per gift</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Dienstbeschrijving</h2>
              <p className="text-muted-foreground leading-relaxed">
                MonnieGift biedt een platform voor het veilig versturen van geldcadeaus. 
                Uitbetalingen worden verwerkt via ABN AMRO. De dienst is beschikbaar 24/7, 
                behoudens onderhoud en technische storingen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Kosten en Betalingen</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Service fee:</strong> €0,99 per gift, ongeacht het bedrag
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Gift bedragen:</strong> tussen €1,00 en €100,00 per gift
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Uitbetaling:</strong> via ABN AMRO naar het rekeningnummer van de ontvanger
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Betalingen worden verwerkt via Stripe en zijn onmiddellijk na bevestiging definitief.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Verantwoordelijkheden</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Gebruiker</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Zorgt voor correcte e-mailadressen</li>
                    <li>Is verantwoordelijk voor de juistheid van de gegevens</li>
                    <li>Houdt de authenticatiecode veilig</li>
                    <li>Respecteert de gebruiksvoorwaarden</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">MonnieGift</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Zorgt voor veilige verwerking van betalingen</li>
                    <li>Behoudt de privacy van gebruikersgegevens</li>
                    <li>Zorgt voor betrouwbare uitbetaling via ABN AMRO</li>
                    <li>Biedt klantenservice bij problemen</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Veiligheid en Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Alle transacties worden versleuteld verwerkt via Stripe. Persoonlijke gegevens 
                worden alleen gebruikt voor de uitvoering van de dienst en worden niet gedeeld 
                met derden, behoudens wettelijke verplichtingen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Aansprakelijkheid</h2>
              <p className="text-muted-foreground leading-relaxed">
                MonnieGift is niet aansprakelijk voor schade als gevolg van:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Onjuiste e-mailadressen of gegevens</li>
                <li>Technische storingen buiten onze controle</li>
                <li>Frauduleus gebruik van de dienst</li>
                <li>Vertragingen in uitbetaling door banken</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Wijzigingen</h2>
              <p className="text-muted-foreground leading-relaxed">
                MonnieGift behoudt zich het recht voor om deze voorwaarden te wijzigen. 
                Gebruikers worden geïnformeerd over wijzigingen via de website of e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Voor vragen over deze voorwaarden kun je contact opnemen via:
              </p>
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-primary font-medium">E-mail: hello@monnie-gift-v222.vercel.app</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
