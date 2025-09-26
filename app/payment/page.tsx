'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Euro, ArrowLeft, Gift, CheckCircle } from 'lucide-react';
import HamburgerMenu from '@/components/HamburgerMenu';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function PaymentForm({
  clientSecret,
  paymentIntentId,
  giftAmount,
  platformFee,
  totalAmount,
  message,
  animationPreset,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  paymentIntentId: string;
  giftAmount: number;
  platformFee: number;
  totalAmount: number;
  message: string;
  animationPreset: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setIsPaymentElementReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent_id=${paymentIntentId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        setError(error.message || 'Er is een fout opgetreden bij de betaling');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Er is een onverwachte fout opgetreden');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-4">
        <div className="p-4 bg-background border border-input rounded-xl">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
            onReady={() => setIsPaymentElementReady(true)}
          />
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-input bg-background text-foreground rounded-xl font-medium hover:bg-muted transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !isPaymentElementReady}
          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verwerken...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Betalen
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [giftAmount, setGiftAmount] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [animationPreset, setAnimationPreset] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const amount = searchParams.get('amount');
        const currency = searchParams.get('currency') || 'eur';
        const message = searchParams.get('message') || '';
        const animationPreset = searchParams.get('animation_preset') || 'confettiRealistic';

        if (!amount) {
          setError('Geen bedrag opgegeven');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/payment-intent/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseInt(amount),
            currency,
            message,
            animationPreset,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Er is een fout opgetreden');
        }

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setGiftAmount(data.giftAmount);
        setPlatformFee(data.platformFee);
        setTotalAmount(data.totalAmount);
        setMessage(message);
        setAnimationPreset(animationPreset);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [searchParams]);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/success?payment_intent_id=${paymentIntentId}&amount=${giftAmount}&currency=eur&message=${encodeURIComponent(message)}&animation_preset=${animationPreset}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/maak-gift');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Betaling voorbereiden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Betaling mislukt</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/maak-gift')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Betaling succesvol!</h1>
          <p className="text-muted-foreground">Je wordt doorgestuurd naar de succespagina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Terug</span>
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">MonnieGift</span>
          </div>
          <HamburgerMenu />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Payment Summary */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Betaling</h1>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cadeau bedrag</span>
              <span className="font-medium">€{(giftAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Servicekosten</span>
              <span className="font-medium">€{(platformFee / 100).toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Totaal</span>
                <span className="text-primary">€{(totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Bericht:</p>
              <p className="text-sm">"{message}"</p>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Betaal met iDEAL</h2>
          
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: 'hsl(var(--primary))',
                    colorBackground: 'hsl(var(--background))',
                    colorText: 'hsl(var(--foreground))',
                    colorDanger: 'hsl(var(--destructive))',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                giftAmount={giftAmount}
                platformFee={platformFee}
                totalAmount={totalAmount}
                message={message}
                animationPreset={animationPreset}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}