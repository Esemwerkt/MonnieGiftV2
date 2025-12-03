"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { Header } from "@/components/ui/header";
import AccordionTabsDemo from "@/components/ui/faq";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
   

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-16 md:py-24">
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            src="/bg-overlay.svg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

<div className="flex flex-col items-center gap-4 relative z-1">
          {/* Gift Box Icon */}
          <div className="w-44 h-44 flex items-center justify-center">
            <img
              src="/hero-icon.png"
              alt="Gift Box"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-center text-4xl md:text-7xl max-w-2xl px-4">
            Maak iemand blij met een
            <span className="text-primary ml-2">MonnieGift</span>
          </h1>

          {/* Subheading */}
          <p className="text-center text-2xl text-foreground leading-relaxed md:leading-normal">
            <b>Verstuur geld</b> als cadeau voor maar €0.99
          </p>

          {/* CTA Button */}
          <Link href="/maak-gift">
            <Button className="bg-secondary text-background hover:bg-secondary/80 rounded-full px-8 py-3 h-14 text-lg font-normal flex items-center gap-3 max-w-xs justify-center">
              <img src="/cad.png" alt="Gift Icon" className="w-8 h-8" />
              <span>Maak een Monniegift</span>
            </Button>
          </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="w-full bg-[#ddb17c]">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-4">
            {/* Step 1 - Bedrag kiezen */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-[#00504A] flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src="/home-img/bedrag-kiezen.png"
                  alt="Bedrag kiezen"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[#0a3530] text-base md:text-lg font-normal text-center">
                Bedrag kiezen
              </p>
            </div>

            {/* Step 2 - Thema selecteren */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-[#00504A] flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src="/home-img/thema-select.png"
                  alt="Thema selecteren"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[#0a3530] text-base md:text-lg font-normal text-center">
                Thema selecteren
              </p>
            </div>

            {/* Step 3 - Bericht Versturen */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-[#004441] flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="/home-img/bericht-versturen.png"
                  alt="Bericht Versturen"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[#0a3530] text-base md:text-lg font-normal text-center">
                Bericht Versturen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="w-full bg-[#dbe3e2]">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16 md:py-24">
          {/* Content */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 w-full md:max-w-none">

              <h2 className="text-2xl md:text-5xl font-normal text-[#0a3530] leading-tight">
                Veilig geld als cadeau versturen met een digitale ontvangst
                kaart
              </h2>

              <p className="text-base md:text-lg text-[#0a3530] leading-relaxed">
                Geen saaie enveloppen meer! Verstuur nu geld als een feestelijk
                en persoonlijk cadeau, direct via onze app. Voeg een leuke
                boodschap toe en maak het schenken van geld bijzonder. Download
                nu en verras iemand met een digitaal cadeau vol mogelijkheden!
              </p>

              <Link href="/maak-gift" className="block">
                <Button className="bg-[#ddb17c] text-[#0a3530] hover:bg-[#cdac6c] rounded-full w-full md:w-auto px-8 py-3 h-14 text-lg font-normal flex items-center justify-center gap-3">
                  <Gift className="w-8 h-8" />
                  Maak een Monniegift
                </Button>
              </Link>
            </div>

            {/* Right Image */}
            <div className="relative w-full md:max-w-none mx-auto md:mx-0">
              <div className="w-full h-56 md:h-[440px] rounded-lg overflow-hidden">
                <img
                  src="/image.png"
                  alt="Safety"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full">
        <div className="w-full md:max-w-4xl md:mx-auto px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-5xl font-normal text-center text-[#ddb17c] mb-8 leading-normal">
            Veel gestelde vragen
          </h2>

          <div className="bg-[#4d7d75]/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 w-full mx-auto">
            <AccordionTabsDemo />
          </div>
        </div>
      </section>

    </div>
  );
}
