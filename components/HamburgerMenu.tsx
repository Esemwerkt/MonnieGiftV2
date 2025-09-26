"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, HelpCircle, FileText, Shield, Lock, Info } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "FAQ",
      href: "/faq",
      description: "Veelgestelde vragen"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Algemene Voorwaarden",
      href: "/terms",
      description: "Gebruiksvoorwaarden"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: "Privacybeleid",
      href: "/privacy",
      description: "Hoe we je gegevens beschermen"
    },
    {
      icon: <Lock className="h-5 w-5" />,
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

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Menu Panel */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Legal & Info</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-6">
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(item.href)}
                  className="w-full text-left p-4 rounded-xl hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t ">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Uitbetaling via ABN AMRO
              </p>
              <p className="text-xs text-muted-foreground">
                Service fee: €0,99 per gift
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
