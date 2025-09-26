'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gift, CheckCircle, ArrowRight, Home, Mail, User, CreditCard } from 'lucide-react';

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const giftId = params.id as string;
  
  const [gift, setGift] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'email' | 'onboarding' | 'claiming' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (giftId) {
      fetchGift();
    }
  }, [giftId]);

  const fetchGift = async () => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      if (response.ok) {
        const giftData = await response.json();
        setGift(giftData);
        setStep('email');
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

  const checkUserStatus = async (email: string) => {
    setIsCheckingUser(true);
    setError('');

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
        setStep('onboarding');
      } else if (result.status === 'new_user') {
        // New user - create account and onboard
        setStep('onboarding');
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setError('Er is een fout opgetreden bij het controleren van je account');
    } finally {
      setIsCheckingUser(false);
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && isValidEmail(email)) {
      checkUserStatus(email);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cadeau laden...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Cadeau succesvol opgehaald!</h1>
          <p className="text-muted-foreground">
            Het geld is overgemaakt naar je account. Bedankt voor het gebruiken van MonnieGift!
          </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">MonnieGift</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Gift Info */}
        {gift && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Je hebt een cadeau ontvangen!
            </h1>
            <p className="text-3xl font-bold text-primary mb-2">
              {formatAmount(gift.amount, gift.currency)}
            </p>
            {gift.message && (
              <p className="text-muted-foreground italic">"{gift.message}"</p>
            )}
          </div>
        )}

        {/* Email Input Step */}
        {step === 'email' && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
              Voer je e-mailadres in om het cadeau op te halen
            </h2>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="je@email.nl"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isCheckingUser || !email || !isValidEmail(email)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCheckingUser ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Controleren...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Cadeau ophalen
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Onboarding Step */}
        {step === 'onboarding' && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Account instellen
            </h2>
            <p className="text-muted-foreground mb-6">
              Om je cadeau te ontvangen, moet je eerst je account instellen met Stripe Connect. 
              Dit duurt slechts een paar minuten.
            </p>
            <button
              onClick={() => {
                // Redirect to Stripe Connect onboarding
                window.location.href = `/onboard?email=${encodeURIComponent(email)}&giftId=${giftId}`;
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <CreditCard className="h-4 w-4" />
              Account instellen
            </button>
          </div>
        )}

        {/* Claiming Step */}
        {step === 'claiming' && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 text-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Cadeau wordt opgehaald...
            </h2>
            <p className="text-muted-foreground">
              Even geduld, we verwerken je cadeau.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            MonnieGift is een veilige manier om digitale cadeaus te versturen en ontvangen.
          </p>
        </div>
      </div>
    </div>
  );
}