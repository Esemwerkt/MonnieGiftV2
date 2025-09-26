"use client";

import { useState, useEffect, useRef } from "react";
import { Gift, ArrowRight, Heart, Shield, Zap, Users } from "lucide-react";
import Link from "next/link";
import { ANIMATION_PRESETS, executeAnimation } from "@/lib/animations";
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
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
        });

        // Add a second burst for more effect
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { x, y },
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MonnieGift</span>
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

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Maak iemand blij met een{" "}
            <span className="text-primary">
              MonnieGift
            </span>
            </h1>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Persoonlijke geldcadeaus die direct en veilig worden overgemaakt. 
            Geen gedoe, gewoon blij maken!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/maak-gift"
              className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <Gift className="h-6 w-6" />
              Geef een MonnieGift
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
          </div>

          {/* USPs Banner */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
              Leuke animaties
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
              Persoonlijk bericht
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
              Altijd €0,99
                          </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
              Altijd veilig
                      </span>
                    </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
                </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Supersnel
              </h3>
              <p className="text-muted-foreground">
                Je MonnieGift wordt direct overgemaakt. Geen wachttijden, geen gedoe.
                    </p>
                  </div>

            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Veilig
              </h3>
              <p className="text-muted-foreground">
                Beveiligd door Stripe. Je gegevens zijn veilig en je betaling is beschermd.
                    </p>
                  </div>

            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Persoonlijk
              </h3>
              <p className="text-muted-foreground">
                Voeg een persoonlijk bericht toe en kies een leuke animatie.
              </p>
                </div>
              </div>

          {/* How it works */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-8">
              Zo werkt het
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Kies bedrag
                </h3>
                <p className="text-muted-foreground text-sm">
                  Selecteer een bedrag tussen €1 en €100
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Voeg details toe
                </h3>
                <p className="text-muted-foreground text-sm">
                  E-mailadressen en een persoonlijk bericht
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                  Betaal & verstuur
                    </h3>
                      <p className="text-muted-foreground text-sm">
                  Veilig betalen en direct versturen
                      </p>
                    </div>
            </div>
          </div>
        </div>

        {/* Preview Section - Claim Success Page */}
        <div id="preview-section" className="text-center mt-20 relative overflow-hidden">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Zo ziet het eruit
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Dit is hoe de ontvanger je MonnieGift ziet wanneer ze deze claimen. 
            Met een prachtige animatie en persoonlijk bericht!
          </p>
          
          {/* Mock Claim Success Page */}
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 text-center relative overflow-hidden">
              {/* Success Header */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  🎉 Gefeliciteerd!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Je hebt een MonnieGift ontvangen van <strong>Sarah</strong>
                </p>
              </div>

              {/* Gift Amount */}
              <div className="bg-accent rounded-xl p-6 mb-6">
                <div className="text-3xl font-bold text-foreground mb-2">€25,00</div>
                <div className="text-sm text-muted-foreground">
                  "Gefeliciteerd met je verjaardag! Geniet ervan! 🎂"
                </div>
              </div>

              {/* Claim Button */}
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors mb-4">
                Claim je MonnieGift
              </button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Veilig overgemaakt via Stripe</span>
              </div>
            </div>

       
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-border">
        <div className="text-center text-muted-foreground space-y-2">
          <p className="flex items-center justify-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Beveiligd door Stripe • Geen account nodig
          </p>
          <p className="text-xs">
            Uitbetaling via ABN AMRO • Service fee: €0,99 per gift
          </p>
        </div>
      </footer>
    </div>
  );
}
