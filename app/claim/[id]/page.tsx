'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gift, CheckCircle, ArrowRight, Home, Mail, User, CreditCard } from 'lucide-react';
import { executeAnimation, AnimationPreset } from '@/lib/animations';
import JSConfetti from 'js-confetti';
import Lottie from 'lottie-react';
import bearAnimation from '@/public/animation-hero/bear.json';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { LoaderFiveDemo } from '@/components/ui/shimmerload';
import { AnimatedLogo } from '@/components/ui/animated-logo';

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const giftId = params.id as string;
  
  const [gift, setGift] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'verification' | 'onboarding' | 'claiming' | 'success' | 'error'>('loading');
  const [showConfetti, setShowConfetti] = useState(false);
  const jsConfettiRef = useRef<JSConfetti | null>(null);

  useEffect(() => {
    if (giftId) {
      fetchGift();
    }
  }, [giftId]);

  // Initialize JSConfetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        jsConfettiRef.current = new JSConfetti();
      } catch (error) {
        console.error('Failed to initialize JSConfetti:', error);
        jsConfettiRef.current = null;
      }
    }
  }, []);

  // Trigger animation when confetti should show
  const hasTriggeredAnimation = useRef(false);
  useEffect(() => {
    if (showConfetti && jsConfettiRef.current && !hasTriggeredAnimation.current) {
      hasTriggeredAnimation.current = true;
      // Pass the confetti function from the JSConfetti instance
      // Use gift's animation preset or default to 'confettiRealistic' if missing/invalid
      const validPresets: AnimationPreset[] = ['customShapes', 'schoolPride', 'snow', 'stars', 'fireworks', 'confettiRealistic'];
      const animationToUse = (gift?.animationPreset && validPresets.includes(gift.animationPreset as AnimationPreset)) 
        ? gift.animationPreset as AnimationPreset 
        : 'confettiRealistic';
      executeAnimation(jsConfettiRef.current.addConfetti.bind(jsConfettiRef.current), animationToUse);
    }
  }, [showConfetti, gift?.animationPreset]);

  const fetchGift = async () => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      if (response.ok) {
        const giftData = await response.json();
        setGift(giftData);
        setStep('verification');
      } else {
        setError('Cadeau niet gevonden');
        setStep('error');
      }
    } catch (err) {
      console.error('Error fetching gift:', err);
      setError('Er is een fout opgetreden');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAuthCode = async (email: string, authCode: string) => {
    setIsCheckingUser(true);
    setError('');

    try {
      const response = await fetch('/api/gifts/verify-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          giftId, 
          email, 
          authCode 
        }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        // Auth code is valid, now check user status
        await checkUserStatus(email);
      } else {
        setError(result.error || 'Ongeldige authenticatiecode of e-mailadres');
      }
    } catch (err) {
      console.error('Error verifying auth code:', err);
      setError('Er is een fout opgetreden bij het verifiëren van je gegevens');
    } finally {
      setIsCheckingUser(false);
    }
  };

  const checkUserStatus = async (email: string) => {
    try {
      const response = await fetch('/api/check-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.status === 'existing_stripe_user') {
        // User has Stripe Connect - claim immediately
        await claimGift(result.user.id);
      } else if (result.status === 'existing_user_no_stripe') {
        // User exists but needs Stripe Connect onboarding
        await createStripeAccountAndRedirect();
      } else if (result.status === 'new_user') {
        // New user - create account and onboard
        await createStripeAccountAndRedirect();
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setError('Er is een fout opgetreden bij het controleren van je account');
    }
  };

  const createStripeAccountAndRedirect = async () => {
    try {
      // Create a new Stripe Express account
      const accountResponse = await fetch('/api/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          giftId 
        }),
      });

      const accountData = await accountResponse.json();

      if (accountResponse.ok) {
        // Redirect to onboarding with account ID
        window.location.href = `/onboard?email=${encodeURIComponent(email)}&account_id=${accountData.accountId}&gift_id=${giftId}`;
      } else {
        throw new Error(accountData.error || 'Failed to create Stripe account');
      }
    } catch (err) {
      console.error('Error creating Stripe account:', err);
      setError('Er is een fout opgetreden bij het aanmaken van je account');
      setStep('error');
    }
  };

  const claimGift = async (userId: string) => {
    setStep('claiming');
    
    try {
      const response = await fetch('/api/gifts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          giftId, 
          userId,
          email 
        }),
      });

      if (response.ok) {
        setStep('success');
        setShowConfetti(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Er is een fout opgetreden bij het claimen');
        setStep('error');
      }
    } catch (err) {
      console.error('Error claiming gift:', err);
      setError('Er is een fout opgetreden bij het claimen');
      setStep('error');
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && authCode && isValidEmail(email)) {
      verifyAuthCode(email, authCode);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'eur' ? '€' : currency === 'usd' ? '$' : '£';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderFiveDemo text="Cadeau laden..." />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Gift className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Cadeau niet gevonden</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="">
        <div className="w-full mx-auto max-w-4xl flex flex-col">
          {/* Header */}
          <div className="px-4 relative top-0 z-10 border-b py-3 border-border">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Terug naar home</span>
              </button>
              <AnimatedLogo />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-4 py-12 space-y-6">
            <div className="backdrop-blur-sm rounded-2xl">
              <div className="gap-y-6 flex flex-col">
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-chart-1/20 to-chart-1/10 rounded-full mb-8">
                    <CheckCircle className="h-12 w-12 text-chart-1" />
                  </div>

                  {/* Success Message */}
                  <h1 className="text-2xl font-bold text-foreground mb-4">
                    Cadeau succesvol opgehaald!
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Het geld is overgemaakt naar je account. Bedankt voor het gebruiken van MonnieGift!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 h-[48px] rounded-xl border transition-all duration-200 bg-background border-input hover:border-border hover:bg-primary/5 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Terug naar home
                  </button>
                  <button
                    onClick={() => window.location.href = '/maak-gift'}
                    className="flex-1 h-[48px] bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Gift className="h-4 w-4" />
                    Verstuur ook een gift
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="w-full mx-auto max-w-4xl flex flex-col">
        {/* Header */}
        <div className="px-4 relative top-0 z-10 border-b py-3 border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar home</span>
            </button>
            <AnimatedLogo />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-12 space-y-6 overflow-x-hidden">
          {/* Gift Info */}
          {gift && (
            <div className="mb-24">
              <div className="gap-y-6 flex flex-col">
                <div className="">
             
                  
                  <div className="text-center">
                    {/* Lottie Animation */}
              
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      Je hebt een cadeau ontvangen!
                    </h1>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {formatAmount(gift.amount, gift.currency)}
                    </p>
                    {gift.message && (
                      <div className="bg-muted/50 border border-border rounded-xl p-5 mt-6 max-w-md mx-auto">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">Persoonlijk bericht:</p>
                        <div className="min-h-[3rem] flex items-center justify-center">
                          <TypingAnimation
                            className="text-base italic text-foreground leading-relaxed"
                            duration={80}
                            delay={1500}
                          >
                            {`"${gift.message}"`}
                          </TypingAnimation>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Step */}
          {step === 'verification' && (
            <div className="">
              <div className="gap-y-6 flex flex-col">
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Verifieer je gegevens
                  </label>
                  <div className="absolute -top-12 -right-6 rotate-12 w-24 h-24 mx-auto mb-4">
                      <Lottie
                        animationData={bearAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  <div className="space-y-4 p-4 bg-background border border-input rounded-xl">
                    <p className="text-muted-foreground text-sm text-center">
                      Voer je e-mailadres en authenticatiecode in om je cadeau te claimen.
                    </p>
                    
                    <form onSubmit={handleVerificationSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="je@email.nl"
                          required
                          className="w-full h-[48px] pl-12 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                      
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                           placeholder="ABC123"
                          maxLength={6}
                          required
                          className="w-full h-[48px] pl-12 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent  text-left text-lg tracking-widest"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Voer de 6-karakter code in die je hebt ontvangen
                      </p>
                      
                      {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <p className="text-sm">{error}</p>
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isCheckingUser || !email || !authCode || !isValidEmail(email)}
                        className="w-full h-[48px] bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        {isCheckingUser ? (
                          <LoaderFiveDemo text="Verifiëren..." />
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            Verifieer & Claim
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Claiming Step */}
          {step === 'claiming' && (
            <div className="">
              <div className="gap-y-6 flex flex-col">
                <div className="">
                  <div className="space-y-4 p-4 bg-background border border-input rounded-xl text-center">
                    <LoaderFiveDemo text="Cadeau wordt opgehaald..." />
                    <p className="text-muted-foreground text-sm">
                      Even geduld, we verwerken je cadeau.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

       
        </div>
      </div>
    </div>
  );
}