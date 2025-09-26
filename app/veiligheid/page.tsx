"use client";

import { ArrowLeft, Lock, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VeiligheidPage() {
  const router = useRouter();

  const securityFeatures = [
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "End-to-End Encryptie",
      description: "Alle transacties worden versleuteld met bank-niveau beveiliging"
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Stripe Beveiliging",
      description: "Betalingen worden verwerkt door Stripe, wereldleider in online betalingen"
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "ABN AMRO Uitbetaling",
      description: "Geld wordt veilig overgemaakt via ABN AMRO's beveiligde netwerk"
    },
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Geen Account Nodig",
      description: "Minimale gegevensverzameling - alleen wat nodig is voor de transactie"
    }
  ];

  const safetyTips = [
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "Controleer E-mailadressen",
      description: "Zorg dat je het juiste e-mailadres van de ontvanger hebt voordat je een gift verstuurt"
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "Bewaar Authenticatiecodes",
      description: "Deel authenticatiecodes alleen met de beoogde ontvanger via een veilig kanaal"
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "Controleer Bedragen",
      description: "Controleer altijd het bedrag voordat je de betaling bevestigt"
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "Gebruik Veilige Netwerken",
      description: "Vermijd het versturen van gifts via openbare WiFi-netwerken"
    }
  ];

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
            <span className="font-semibold text-foreground">Veiligheid</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Veiligheid & Beveiliging
          </h1>
          <p className="text-muted-foreground">
            Je veiligheid is onze prioriteit. Ontdek hoe we je gegevens en geld beschermen.
          </p>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Onze Beveiligingsmaatregelen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                  className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mb-12">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Technische Beveiliging
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Betalingen</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>PCI DSS Level 1 compliant (Stripe)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>256-bit SSL encryptie</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Fraude detectie en preventie</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>3D Secure authenticatie</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Uitbetalingen</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>ABN AMRO beveiligde netwerken</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time transactie monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Anti-witwas controles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automatische verificatie</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Veiligheidstips voor Gebruikers
          </h2>
          <div className="space-y-4">
            {safetyTips.map((tip, index) => (
              <div
                key={index}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1">
                      {tip.title}
                    </h3>
                    <p className="text-amber-800 text-sm">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="mb-12">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-primary mb-6">
              Compliance & Certificeringen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white rounded-xl p-4 mb-3">
                  <Shield className="h-8 w-8 text-primary mx-auto" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AVG/GDPR</h3>
                <p className="text-sm text-muted-foreground">
                  Volledig compliant met Europese privacywetgeving
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-xl p-4 mb-3">
                  <Lock className="h-8 w-8 text-primary mx-auto" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">PCI DSS</h3>
                <p className="text-sm text-muted-foreground">
                  Level 1 certificering via Stripe
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-xl p-4 mb-3">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">ISO 27001</h3>
                <p className="text-sm text-muted-foreground">
                  Beveiligingsmanagement via partners
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Veiligheidsprobleem Melden
            </h3>
            <p className="text-muted-foreground mb-4">
              Heb je een beveiligingsprobleem ontdekt? Laat het ons weten.
            </p>
            <a
              href="mailto:security@monnie-gift-v222.vercel.app"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              security@monnie-gift-v222.vercel.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
