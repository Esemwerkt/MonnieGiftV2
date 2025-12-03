"use client";

import Link from "next/link";

const legalLinks = [
  { label: "Voorwaarden", href: "#" },
  { label: "Privacyverklaring", href: "#" },
  { label: "Cookieverklaring", href: "#" },
];

export function Footer() {
  return (
    <footer className="w-full border-t py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <p className="text-white/85 text-sm font-medium">
              Veilig betalen en ontvangen met:
            </p>
            <div className="flex items-center gap-3">
              <img src="/footer-img/stripe.svg" alt="Stripe" className="h-5" />
              <img src="/footer-img/ideal.svg" alt="iDEAL" className="h-6" />
            </div>
          </div>

          <div className="flex items-center gap-8">
            {legalLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-muted underline hover:text-white transition-colors text-sm font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

