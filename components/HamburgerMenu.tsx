"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, HelpCircle, FileText, Shield, Lock, Gift, ArrowRight } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      icon: <HelpCircle className="h-6 w-6" />,
      label: "FAQ",
      href: "/faq",
      description: "Veelgestelde vragen"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: "Algemene Voorwaarden",
      href: "/terms",
      description: "Gebruiksvoorwaarden"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      label: "Privacybeleid",
      href: "/privacy",
      description: "Hoe we je gegevens beschermen"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      label: "Veiligheid",
      href: "/veiligheid",
      description: "Beveiligingsmaatregelen"
    }
  ];

  const handleMenuClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-foreground" />
      </button>

      {/* Full Screen Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-primary text-primary-foreground">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-8">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8" />
                <span className="text-2xl font-bold">MonnieGift</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-8 pb-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-full">
                  
                  {/* Left Column - Create Gift */}
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-4xl font-bold mb-6">Cadeau Versturen</h2>
                      <button
                        onClick={() => handleMenuClick("/maak-gift")}
                        className="group w-full bg-primary-foreground text-primary px-8 py-6 rounded-2xl font-semibold text-xl hover:bg-primary-foreground/90 transition-colors flex items-center justify-center gap-3"
                      >
                        <Gift className="h-6 w-6" />
                        Geef een MonnieGift
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Limieten</h3>
                      <div className="space-y-3 text-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                          <span>Maximaal €50 per gift</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                          <span>Maximaal 10 gifts per dag</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                          <span>Maximaal €1000 per maand</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Legal Pages */}
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold">Legal & Info</h2>
                    <div className="space-y-4">
                      {menuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleMenuClick(item.href)}
                          className="group w-full text-left p-6 rounded-2xl hover:bg-primary-foreground/10 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold group-hover:text-primary-foreground/80 transition-colors">
                                {item.label}
                              </h3>
                              <p className="text-primary-foreground/70 mt-1">
                                {item.description}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Contact Info */}
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold">Contact</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-3">E-mail</h3>
                        <a 
                          href="mailto:hello@monnie-gift-v222.vercel.app"
                          className="text-lg underline hover:no-underline transition-all"
                        >
                          hello@monnie-gift-v222.vercel.app
                        </a>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Uitbetaling</h3>
                        <p className="text-lg">Via ABN AMRO</p>
                        <p className="text-primary-foreground/70">Service fee: €0,99 per gift</p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3">Beveiliging</h3>
                        <p className="text-lg">Stripe & ABN AMRO</p>
                        <p className="text-primary-foreground/70">Geen account nodig</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
