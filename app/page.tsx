"use client";

import { useState, useEffect, useRef } from "react";
import { Gift, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import Lottie from "lottie-react";
import bearAnimation from "@/public/animation-hero/bear.json";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { SparklesText } from "@/components/ui/sparkles-text";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { BentoGridThirdDemo } from "@/components/ui/bentoCustom";
import { NavbarDemo } from "@/components/ui/navbarS";
import AccordionTabsDemo from "@/components/ui/faq";
import Footer from "@/components/ui/Footer";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section id="preview-section" className="pb-12 relative w-full">
      <NavbarDemo />

      <div className="relative overflow-hidden pt-20" id="home">
        <div className="w-full mx-auto max-w-4xl flex flex-col relative z-10">
          {/* Main Content - Scrollable */}
          <main className="flex-1 px-0 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="py-12 text-center max-w-6xl mx-auto px-4">
              {/* Main Heading */}
              <div className="mb-8 sm:mb-10 lg:mb-12">
                <SparklesText
                  className="text-4xl xs:text-5xl sm:text-6xl  font-bold text-foreground leading-tight"
                  sparklesCount={6}
                  colors={{ first: "#d4b483", second: "#556b68" }}
                >
                  Maak iemand blij met een{" "}
                  <span className="text-primary">MonnieGift</span>
                </SparklesText>
              </div>

              {/* Chat Balloon */}
              <div className="-mb-6 flex justify-center ">
                <div className="relative rotate-12 -right-14">
                  {/* Balloon */}
                  <div className="bg-white rounded-2xl px-3 py-2 shadow-lg">
                    <TypingAnimation
                      className="text-xs font-bold  text-background"
                      duration={80}
                      delay={1000}
                    >
                      Geld cadeau geven is makkelijk!
                    </TypingAnimation>
                  </div>
                  {/* Tail */}
                  <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                  </div>
                  {/* Tail border */}
                  <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-9 border-r-9 border-t-9 border-l-transparent border-r-transparent"></div>
                  </div>
                </div>
              </div>

              {/* Lottie Animation */}
              <div className="-mb-6  flex justify-center">
                <div className="w-40 h-40">
                  <Lottie
                    animationData={bearAnimation}
                    loop={true}
                    autoplay={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>

              {/* CTA Button */}
              <div className="mb-12 ">
                <Link href="/maak-gift">
                  <InteractiveHoverButton className="bg-primary text-primary-foreground py-5 font-bold">
                    Maak een MonnieGift
                  </InteractiveHoverButton>
                </Link>

                {/* <Link
                  href="/maak-gift"
                  className="border group inline-flex items-center gap-3 sm:gap-4 px-8  py-4  bg-primary text-primary-foreground rounded-xl sm:rounded-2xl hover:bg-primary/90 transition-all duration-200 font-bold text-lg "
                >
                  Maak een MonnieGift
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 group-hover:translate-x-1 transition-transform" />
                </Link> */}
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="max-w-4xl mx-auto min-h-screen py-24 px-4" id="wat-is-monniegift">
        <div className="pb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Wat is MonnieGift?</h2>
          <p className="text-muted-foreground mb-4">
            MonnieGift helpt je eenvoudig geld cadeau te doen.
          </p>
        </div>

        <BentoGridThirdDemo />
      </div>

      <div className="max-w-4xl mx-auto py-24 min-h-screen px-4" id="faq">
        <div className="pb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Veelgestelde vragen</h2>
          <p className="text-muted-foreground mb-4">
            Hier vind je antwoorden op veelgestelde vragen over MonnieGift.
          </p>
        </div>
        <AccordionTabsDemo />
      </div>

      <Footer />
    </section>
  );
}
