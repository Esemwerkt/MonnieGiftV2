'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, ArrowRight, Home } from 'lucide-react';

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
    <div className="bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Snelle Account Setup
          </h1>
          <p className="text-muted-foreground">
            Alleen e-mail en IBAN nodig voor je cadeau
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-card/50 backdrop-blur-sm border  rounded-2xl p-6 shadow-xl">
          {error ? (
            <div className="text-center">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-destructive">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Opnieuw Proberen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Bankrekening Toevoegen</h3>
                    <p className="text-sm text-muted-foreground">
                      Voeg je IBAN toe voor uitbetalingen
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-chart-1/20 rounded-lg flex items-center justify-center">
                    <span className="text-chart-1 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Verificatie</h3>
                    <p className="text-sm text-muted-foreground">
                      Minimale verificatie (alleen e-mail + IBAN)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-chart-2/20 rounded-lg flex items-center justify-center">
                    <span className="text-chart-2 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Klaar!</h3>
                    <p className="text-sm text-muted-foreground">
                      Ontvang je cadeau op je bankrekening
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
                <p className="text-sm text-chart-1">
                  💡 <strong>KYC-Light:</strong> Voor cadeautjes tot €100 is alleen e-mail en IBAN nodig. Geen ID-upload of uitgebreide verificatie!
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStartOnboarding}
                disabled={!onboardingUrl || loading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Laden...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Start Setup
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Back Button */}
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Terug naar Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
