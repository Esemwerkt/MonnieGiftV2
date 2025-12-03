import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/40">
      {/* Separator line */}
      <div className="w-full h-px bg-muted-foreground/20" />
      
      {/* Footer content */}
      <div className="w-full md:max-w-7xl md:mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Left side: Payment methods */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <p className="text-foreground text-sm md:text-base whitespace-nowrap">
              Veilig betalen en ontvangen met:
            </p>
            <div className="flex items-center gap-4 md:gap-6">
              {/* Stripe logo */}
              <div className="relative h-6 w-auto">
                <Image
                  src="/footer-img/stripe.svg"
                  alt="Stripe"
                  width={60}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              </div>
              {/* iDEAL logo */}
              <div className="relative h-8 w-auto">
                <Image
                  src="/footer-img/ideal.svg"
                  alt="iDEAL"
                  width={80}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right side: Links */}
          <div className="flex items-center gap-6 md:gap-8">
            <a
              href="/voorwaarden"
              className="text-primary underline text-sm md:text-base hover:text-primary/80 transition-colors"
            >
              Voorwaarden
            </a>
            <a
              href="/privacyverklaring"
              className="text-primary underline text-sm md:text-base hover:text-primary/80 transition-colors"
            >
              Privacyverklaring
            </a>
            <a
              href="/cookieverklaring"
              className="text-primary underline text-sm md:text-base hover:text-primary/80 transition-colors"
            >
              Cookieverklaring
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
