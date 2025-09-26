"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Privacybeleid</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Privacybeleid
          </h1>
          <p className="text-muted-foreground">
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Inleiding</h2>
              <p className="text-muted-foreground leading-relaxed">
                MonnieGift respecteert je privacy en beschermt je persoonlijke gegevens. 
                Dit privacybeleid legt uit hoe we je gegevens verzamelen, gebruiken en beschermen 
                in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Gegevens die we verzamelen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Persoonlijke gegevens</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>E-mailadressen (verzender en ontvanger)</li>
                    <li>Gift bedragen en berichten</li>
                    <li>Authenticatiecodes</li>
                    <li>IP-adressen en browsergegevens</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Betalingen</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Betalingstransacties via Stripe</li>
                    <li>Uitbetalingen via ABN AMRO</li>
                    <li>Transactie-identificatoren</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Doeleinden van gegevensverwerking</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We gebruiken je gegevens voor:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Dienstverlening:</strong> Verwerken en versturen van gifts</li>
                <li><strong>Betalingen:</strong> Verwerken van betalingen via Stripe</li>
                <li><strong>Uitbetalingen:</strong> Overmaken van geld via ABN AMRO</li>
                <li><strong>Communicatie:</strong> Versturen van bevestigingsmails</li>
                <li><strong>Beveiliging:</strong> Voorkomen van fraude en misbruik</li>
                <li><strong>Wettelijke verplichtingen:</strong> Voldoen aan belasting- en andere wetten</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Rechtsgrondslag</h2>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <h3 className="text-lg font-medium text-primary mb-2">Uitvoering overeenkomst</h3>
                  <p className="text-muted-foreground">
                    Verwerking van gegevens die noodzakelijk zijn voor het verlenen van onze dienst.
                  </p>
                </div>
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
                  <h3 className="text-lg font-medium text-secondary-foreground mb-2">Wettelijke verplichting</h3>
                  <p className="text-muted-foreground">
                    Voldoen aan belasting- en anti-witwaswetgeving.
                  </p>
                </div>
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                  <h3 className="text-lg font-medium text-accent-foreground mb-2">Gerechtvaardigd belang</h3>
                  <p className="text-muted-foreground">
                    Voorkomen van fraude en verbeteren van onze dienstverlening.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Gegevensdeling</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We delen je gegevens alleen met:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Stripe:</strong> Voor betalingsverwerking</li>
                <li><strong>ABN AMRO:</strong> Voor uitbetalingen</li>
                <li><strong>Resend:</strong> Voor e-mailverzending</li>
                <li><strong>Wettelijke autoriteiten:</strong> Indien wettelijk verplicht</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We verkopen nooit je gegevens aan derden voor marketingdoeleinden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Gegevensbeveiliging</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We beschermen je gegevens met:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>End-to-end encryptie voor alle transacties</li>
                  <li>Veilige HTTPS-verbindingen</li>
                  <li>Regelmatige beveiligingsaudits</li>
                  <li>Toegangscontrole en monitoring</li>
                  <li>Backup en disaster recovery procedures</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Bewaartermijnen</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Transactiegegevens</h3>
                  <p className="text-muted-foreground">7 jaar (wettelijke verplichting)</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">E-mailadressen</h3>
                  <p className="text-muted-foreground">Tot 1 jaar na laatste activiteit</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Logbestanden</h3>
                  <p className="text-muted-foreground">6 maanden</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Je rechten</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Je hebt de volgende rechten:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Inzage</h3>
                  <p className="text-sm text-muted-foreground">Bekijk welke gegevens we van je hebben</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Rectificatie</h3>
                  <p className="text-sm text-muted-foreground">Corrigeer onjuiste gegevens</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Verwijdering</h3>
                  <p className="text-sm text-muted-foreground">Verwijder je gegevens</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="font-medium text-foreground mb-2">Beperking</h3>
                  <p className="text-sm text-muted-foreground">Beperk verwerking van gegevens</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Voor vragen over dit privacybeleid of je gegevens:
              </p>
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-primary font-medium">E-mail: privacy@monniegift.nl</p>
                <p className="text-muted-foreground text-sm mt-1">
                  We reageren binnen 30 dagen op je verzoek
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
