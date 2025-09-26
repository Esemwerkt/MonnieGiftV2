'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Gift, ArrowRight, Mail, CheckCircle, Home } from 'lucide-react';
import MoneyLoader from '@/components/MoneyLoader';
import JSConfetti from 'js-confetti';

interface GiftData {
  id: string;
  amount: number;
  currency: string;
  message?: string;
  senderEmail: string;
  isClaimed: boolean;
  claimedAt?: string;
  createdAt: string;
  authenticationCode?: string;
  previewConfettiType?: string;
  previewConfettiVariant?: string;
  previewAnimationStyle?: string;
}

export default function ClaimGiftPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const giftId = params.id as string;
  
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const [jsConfetti, setJsConfetti] = useState<JSConfetti | null>(null);
  const claimProcessedRef = useRef(false);
  
  // Initialize js-confetti only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJsConfetti(new JSConfetti());
    }
  }, []);

  // Trigger confetti when showConfetti state changes
  useEffect(() => {
    if (showConfetti && jsConfetti) {
      // Add a small delay for smoother animation
      setTimeout(() => {
        // Create multiple explosion bursts for dramatic effect
        const createExplosion = (delay: number, config: any) => {
          setTimeout(() => {
            jsConfetti.addConfetti(config);
          }, delay);
        };

        // Main explosion burst
        createExplosion(0, {
          confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7'],
          confettiNumber: 500,
          confettiRadius: 2,
        });

        // Secondary burst for more explosion effect
        createExplosion(150, {
          confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7'],
          confettiNumber: 150,
          confettiRadius: 4,
        });

        // Final smaller burst
        createExplosion(300, {
          confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7'],
          confettiNumber: 100,
          confettiRadius: 3,
        });
      }, 300); // Small delay to let the success state render first
    }
  }, [showConfetti, jsConfetti]);

  useEffect(() => {
    if (giftId) {
      fetchGift();
    } else {
    }
  }, [giftId]);

  // Check if returning from onboarding completion
  useEffect(() => {
    const onboardingComplete = searchParams.get('onboarding_complete');
    const autoClaim = searchParams.get('auto_claim');
    const emailParam = searchParams.get('email');
    
    if (onboardingComplete === 'true' && emailParam && gift && !claimProcessedRef.current) {
      // Pre-fill email and auth code
      setEmail(emailParam);
      setAuthCode(gift.authenticationCode || '');
      
      // If auto_claim is true, complete the claim process
      if (autoClaim === 'true') {
        claimProcessedRef.current = true;
        completeClaimAfterOnboarding(emailParam);
        return;
      }
      
      // Check if gift is already claimed
      if (gift.isClaimed) {
        claimProcessedRef.current = true;
        setClaimSuccess(true);
        return;
      }
      
      // Don't auto-complete the claim - let the user do it manually
      // This prevents the loop
    }
  }, [searchParams, gift]);

  const fetchGift = async () => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gift');
      }

      setGift(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gift');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !authCode) return;

    setClaiming(true);
    try {
      const response = await fetch('/api/gifts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          giftId,
          email,
          authenticationCode: authCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim gift');
      }

      // Check if onboarding is needed
      if (data.needsOnboarding) {
        // Redirect to custom onboarding with account ID, gift ID, and email
        router.push(`/onboard/custom?account_id=${data.accountId}&gift_id=${giftId}&email=${encodeURIComponent(email)}`);
        return;
      }

      setClaimSuccess(true);
      setShowConfetti(true);
      
      // Confetti will be triggered by the useEffect when showConfetti changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim gift');
    } finally {
      setClaiming(false);
    }
  };

  const checkAccountRequirements = async (accountId: string) => {
    try {
      const response = await fetch(`/api/connect/account-update?account_id=${accountId}`);
      const data = await response.json();
      
      if (response.ok && data.needsUpdate) {
        return {
          needsUpdate: true,
          requirements: data.requirements,
          updateUrl: null // Will be generated when user clicks to update
        };
      }
      
      return { needsUpdate: false };
    } catch (error) {
      return { needsUpdate: false };
    }
  };

  const completeClaimAfterOnboarding = async (email: string) => {
    try {
      
      // Get the user's account ID from the URL or from the user data
      const accountId = searchParams.get('account_id');
      
      if (!accountId) {
        setError('Account ID not found');
        return;
      }

      const response = await fetch('/api/gifts/complete-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete claim');
      }

      setClaimSuccess(true);
      setShowConfetti(true);
      
      // Confetti will be triggered by the useEffect when showConfetti changes
      // Note: No need to refresh gift data as we're setting claimSuccess to true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete claim');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MoneyLoader text="Cadeau laden..." size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">
            Gift ID: {giftId || 'undefined'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Params: {JSON.stringify(params)}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Opnieuw Proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gift) return null;


  if (claimSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/10 to-chart-2/10 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-1/20 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-chart-1" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Cadeau Opgehaald! 🎉
            </h1>
            <p className="text-muted-foreground mb-6">
              Je hebt {formatAmount(gift.amount, gift.currency)} ontvangen van {gift.senderEmail}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Het geld wordt binnen 1-2 werkdagen overgemaakt naar je bankrekening.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Terug naar Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gift.isClaimed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-6">
            <p className="text-chart-1 font-medium mb-2">Dit cadeau is al opgehaald!</p>
            <p className="text-sm text-chart-1">
              Opgehaald op {new Date(gift.claimedAt!).toLocaleDateString('nl-NL')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cadeau Ophalen
          </h1>
          <p className="text-muted-foreground">
            Je hebt een geld cadeau ontvangen!
          </p>
        </div>

        {/* Gift Details */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6 ">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {formatAmount(gift.amount, gift.currency)}
            </div>
            <p className="text-muted-foreground mb-4">
              van {gift.senderEmail}
            </p>
            {gift.message && (
              <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary">
                <p className="text-foreground italic">
                  "{gift.message}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Claim Form */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 ">
          <form onSubmit={handleClaim} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Je E-mailadres
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                required
                className="block w-full pl-3 pr-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
              />
            </div>

            {/* Auth Code */}
            <div>
              <label htmlFor="authCode" className="block text-sm font-medium text-foreground mb-2">
                Authenticatie Code
              </label>
              <input
                type="text"
                id="authCode"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                required
                className="block w-full pr-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer text-center tracking-widest font-mono"
                style={{ letterSpacing: "0.2em" }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deze code staat in de e-mail die je hebt ontvangen
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={claiming || !email || !authCode}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {claiming ? (
                <>
                  <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Cadeau Ophalen...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Cadeau Ophalen
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
            <p className="text-xs text-chart-1">
              💡 <strong>Nieuwe gebruiker?</strong> We helpen je automatisch met het opzetten van je account om het geld te ontvangen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}