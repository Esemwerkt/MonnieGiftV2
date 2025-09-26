"use client";

import { useState, useEffect, useRef } from "react";
import { Gift, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const fireworksIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Start fireworks animation loop only in preview section
  useEffect(() => {
    if (!mounted) return;

    const startFireworks = async () => {
      const confetti = (await import('canvas-confetti')).default;
      
      const playFireworks = () => {
        // Get the preview section element
        const previewSection = document.getElementById('preview-section');
        if (!previewSection) return;

        // Get the bounding rectangle of the preview section
        const rect = previewSection.getBoundingClientRect();
        
        // Calculate center position within the preview section
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // Create fireworks animation centered on the preview section
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x, y },
          colors: ['#d4b483', '#556b68', '#0a2d27', '#96ceb4', '#feca57', '#ff9ff3']
        });

        // Add a second burst for more effect
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { x, y },
            colors: ['#d4b483', '#556b68', '#0a2d27', '#96ceb4', '#feca57', '#ff9ff3']
          });
        }, 200);
      };

      // Play immediately
      playFireworks();
      
      // Set up interval to loop every 3 seconds
      fireworksIntervalRef.current = setInterval(playFireworks, 3000);
    };

    // Add a small delay to ensure the preview section is rendered
    const timer = setTimeout(startFireworks, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (fireworksIntervalRef.current) {
        clearInterval(fireworksIntervalRef.current);
      }
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile-first container */}
      <div className="w-full mx-auto min-h-screen max-w-4xl flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">MonnieGift</span>
            </div>
            <div className="flex items-center gap-4">
              <HamburgerMenu />
              <Link
                href="/maak-gift"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Geef een MonnieGift
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 px-0 py-6 space-y-6">
          <div className="text-center max-w-5xl mx-auto px-4">
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
            Maak iemand blij met een{" "}
            <span className="text-primary">
              MonnieGift
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Persoonlijke geldcadeaus die direct en veilig worden overgemaakt. 
            Geen gedoe, gewoon blij maken!
          </p>

          {/* CTA Button */}
          <div className="mb-20">
            <Link
              href="/maak-gift"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all duration-200 font-semibold text-xl shadow-lg hover:shadow-xl"
            >
              Geef een MonnieGift
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="text-center p-6 bg-card mx-4 rounded-md">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Supersnel
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Je MonnieGift wordt direct overgemaakt. Geen wachttijden, geen gedoe.
              </p>
            </div>

            <div className="text-center p-6 bg-card mx-4 rounded-md">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Veilig
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Beveiligd door Stripe. Je gegevens zijn veilig en je betaling is beschermd.
              </p>
            </div>

            <div className="text-center p-6 bg-card mx-4 rounded-md">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Persoonlijk
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Voeg een persoonlijk bericht toe en kies een leuke animatie.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Zo werkt het
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-card mx-4 rounded-md">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Kies bedrag
                </h3>
                <p className="text-muted-foreground">
                  Selecteer een bedrag tussen €1 en €100
                </p>
              </div>

              <div className="text-center p-6 bg-card mx-4 rounded-md">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Voeg details toe
                </h3>
                <p className="text-muted-foreground">
                  E-mailadressen en een persoonlijk bericht
                </p>
              </div>

              <div className="text-center p-6 bg-card mx-4 rounded-md">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Betaal & verstuur
                </h3>
                <p className="text-muted-foreground">
                  Veilig betalen en direct versturen
                </p>
              </div>
            </div>
          </div>

          {/* Limits Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Limieten
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-card mx-4 rounded-md">
                  <div className="text-2xl font-bold text-foreground mb-2">€50</div>
                  <div className="text-muted-foreground">Max per gift</div>
                </div>
                <div className="text-center p-6 bg-card mx-4 rounded-md">
                  <div className="text-2xl font-bold text-foreground mb-2">10</div>
                  <div className="text-muted-foreground">Gifts per dag</div>
                </div>
                <div className="text-center p-6 bg-card mx-4 rounded-md">
                  <div className="text-2xl font-bold text-foreground mb-2">€1000</div>
                  <div className="text-muted-foreground">Per maand</div>
                </div>
              </div>
            </div>
          </div>
          </div>

      
        </main>

        {/* Footer */}
        <footer className="px-4 py-8 border-t border-border">
          <div className="text-center text-muted-foreground space-y-2">
            <p className="text-sm">
              Beveiligd door Stripe • Geen account nodig
            </p>
            <p className="text-xs">
              Uitbetaling via ABN AMRO • Service fee: €0,99 per gift
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
