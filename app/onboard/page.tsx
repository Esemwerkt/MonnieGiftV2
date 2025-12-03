'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, ArrowRight, Home, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function OnboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingUrl, setOnboardingUrl] = useState('');

  const email = searchParams.get('email');
  const accountId = searchParams.get('account_id');

  useEffect(() => {
    if (accountId) {
      createOnboardingLink(accountId);
    }
  }, [accountId]);

  const createOnboardingLink = async (accountId: string) => {
    try {
      const response = await fetch('/api/connect/onboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accountId,
          giftId: searchParams.get('gift_id'),
          email: searchParams.get('email'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      setOnboardingUrl(data.onboardingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create onboarding link');
    }
  };

  const handleStartOnboarding = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <header className="w-full bg-primary">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-center">
          <p className="flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <Gift className="h-6 w-6 text-primary-foreground" />
            MonnieGift
          </p>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 w-full bg-background flex items-center justify-center">
        <div className="w-full md:max-w-4xl md:mx-auto px-4 py-16 md:py-24">
          {error ? (
            <div className="md:text-center space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                <p className="text-destructive">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Opnieuw Proberen
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="md:text-center space-y-4"
              >
                <h1 
                  className="text-4xl md:text-7xl font-normal text-foreground/85"
                  style={{ fontFamily: 'Rockwell, serif' }}
                >
                  Account aanmaken
                </h1>
                <p className="text-base md:text-lg text-foreground/85 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                  We hebben éénmalig je gegevens nodig zodat jij in de toekomst direct jouw monniegift kunt innen, woehoe!
                </p>
              </motion.div>

              {/* Progress Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-center items-start justify-center gap-4 md:gap-8 py-8"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">1</span>
                  </div>
                  <p className="text-sm md:text-base text-foreground/85 md:text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Maak een account aan
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">2</span>
                  </div>
                  <p className="text-sm md:text-base text-foreground/85 md:text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Verificatie
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">3</span>
                  </div>
                  <p className="text-sm md:text-base text-foreground/85 md:text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Bevestig je email
                  </p>
                </div>
              </motion.div>

              {/* Verification Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-6 md:text-center"
              >
                <h2 
                  className="text-xl md:text-3xl font-normal text-primary"
                  style={{ fontFamily: 'Rockwell, serif' }}
                >
                  Verificatie bij onze betaalprovider (I)
                </h2>
                <p className="text-base md:text-lg text-foreground/85 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Bij de volgende stap wordt je doorverwezen naar onze betaalprovider Stripe en worden je gegevens gecontroleerd. Dit is nodig om jouw cadeau veilig te kunnen innen.
                </p>
                
                {/* Verify Button */}
                <button
                  onClick={handleStartOnboarding}
                  disabled={!onboardingUrl || loading}
                  className="w-full px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-normal text-base md:text-xl hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      Verifieren
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

    
    </div>
  );
}
