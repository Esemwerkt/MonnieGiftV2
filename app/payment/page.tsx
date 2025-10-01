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
import { Euro, ArrowLeft, Gift, CheckCircle, InfoIcon } from 'lucide-react';
import Image from 'next/image';

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
      console.log('Stripe or elements not ready:', { stripe: !!stripe, elements: !!elements });
      return;
    }

    console.log('Submitting payment for:', { paymentIntentId, giftAmount, totalAmount });
    setIsProcessing(true);
    setError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: 'iDEAL Payment',
            },
          },
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
      {/* Hidden PaymentElement for Stripe functionality */}
      <div style={{ display: 'none' }}>
        <PaymentElement
          options={{
            layout: 'accordion',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              }
            },
            fields: {
              billingDetails: {
                name: 'never',
                email: 'auto',
              }
            },
            paymentMethodOrder: ['ideal'],
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            }
          }}
          onReady={() => setIsPaymentElementReady(true)}
        />
      </div>




      {/* Custom iDEAL Payment UI */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-3">
          Betaalmethode
        </label>
        
        <div className="p-4 bg-background border-2 border-muted rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Image 
                src="/payment-logo/ideal.svg" 
                alt="iDEAL" 
                width={32}
                height={32}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">iDEAL</p>
              <p className="text-xs text-muted-foreground">Direct betalen via je bank</p>
            </div>
            <div className="w-4 h-4 rounded-full border-2 border-primary bg-muted flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-[48px]  rounded-xl border transition-all duration-200 bg-background border-input hover:border-border hover:bg-primary/5 text-sm font-medium"
        >
          Annuleren
        </button> */}
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !isPaymentElementReady}
          className="flex-1 h-[48px]  bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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

        console.log('Creating payment intent with:', { amount, currency, message, animationPreset });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Betaling voorbereiden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
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
      <div className="bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
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
    <div className="">
      <div className="w-full mx-auto max-w-4xl flex flex-col">
        {/* Header */}
        <div className="px-4 relative top-0 z-10 border-b  py-3 border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar cadeau</span>
            </button>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">MonnieGift</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4  px-0 py-12 space-y-6">

          {/* Payment Summary */}
          <div className="">
            <div className="gap-y-6 flex flex-col">
              <div className="">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Betalingsoverzicht
                </label>
                
                <div className="space-y-3 p-4 bg-background border border-input rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cadeau bedrag</span>
                    <span className="text-sm font-medium">€{(giftAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Servicekosten</span>
                    <span className="text-sm font-medium">€{(platformFee / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Totaal</span>
                      <span className="text-primary font-semibold">€{(totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className="mt-6 p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Persoonlijk bericht:</p>
                    <p className="text-sm">"{message}"</p>
                  </div>
                )}
              </div>

              {/* Payment Form */}
              <div className="">
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
                          spacingUnit: '8px',
                          borderRadius: '12px',
                          fontSizeBase: '16px',
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

          {/* Security Note */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Direct bezorgd</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>100% veilig</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Geen wachtwoord</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Je MonnieGift cadeau is direct klaar om te delen 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}