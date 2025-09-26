"use client";

import { ArrowLeft, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FAQPage() {
  const router = useRouter();

  const faqs = [
    {
      question: "Hoe werkt MonnieGift?",
      answer: "MonnieGift is een veilige manier om geldcadeaus te versturen. Je kiest een bedrag, voegt een persoonlijk bericht toe, en de ontvanger krijgt een e-mail met een unieke code om het geld op te halen. Uitbetaling gebeurt via ABN AMRO."
    },
    {
      question: "Wat zijn de kosten?",
      answer: "Er is een vaste service fee van €0,99 per gift, ongeacht het bedrag. Het cadeau bedrag wordt direct overgemaakt naar de ontvanger via ABN AMRO."
    },
    {
      question: "Hoe veilig is MonnieGift?",
      answer: "MonnieGift gebruikt Stripe voor veilige betalingen en ABN AMRO voor uitbetalingen. Alle transacties zijn versleuteld en voldoen aan de hoogste beveiligingsstandaarden. Je hoeft geen account aan te maken."
    },
    {
      question: "Hoe snel wordt het geld overgemaakt?",
      answer: "Na succesvolle betaling wordt het geld direct overgemaakt via ABN AMRO. De ontvanger kan het geld meestal binnen enkele minuten claimen."
    },
    {
      question: "Wat als de ontvanger het geld niet claimt?",
      answer: "Het geld blijft veilig opgeslagen. De ontvanger heeft 30 dagen de tijd om het geld te claimen. Na deze periode wordt het bedrag automatisch teruggestort."
    },
    {
      question: "Kan ik een gift annuleren?",
      answer: "Ja, je kunt een gift annuleren zolang deze nog niet is geclaimd door de ontvanger. Neem contact met ons op via de contactgegevens."
    },
    {
      question: "Welke betalingsmethoden worden geaccepteerd?",
      answer: "We accepteren iDEAL, creditcards en andere door Stripe ondersteunde betalingsmethoden. Alle betalingen worden veilig verwerkt door Stripe."
    },
    {
      question: "Is er een minimum of maximum bedrag?",
      answer: "Het minimum bedrag is €1,00 en het maximum bedrag is €100,00 per gift. Dit helpt ons om de service veilig en betrouwbaar te houden."
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
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Veelgestelde Vragen</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Veelgestelde Vragen
          </h1>
          <p className="text-muted-foreground">
            Alles wat je moet weten over MonnieGift
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {faq.question}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Nog vragen?
            </h3>
            <p className="text-muted-foreground mb-4">
              Neem contact met ons op voor persoonlijke hulp
            </p>
            <a
              href="mailto:hello@monniegift.nl"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              hello@monniegift.nl
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
