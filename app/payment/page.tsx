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
  recipientEmail,
  message,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  paymentIntentId: string;
  giftAmount: number;
  platformFee: number;
  totalAmount: number;
  recipientEmail: string;
  message: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement('payment');
    if (paymentElement) {
      paymentElement.on('ready', () => {
        setIsPaymentElementReady(true);
      });

      paymentElement.on('change', (event) => {
        if (event.complete) {
        }
        if (event.empty) {
        }
      });
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const paymentElement = elements.getElement('payment');

    if (!paymentElement) {
      setError('Payment form not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent_id=${paymentIntentId}&amount=${giftAmount}&currency=eur&recipient=${encodeURIComponent(
            recipientEmail
          )}&message=${encodeURIComponent(message)}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          setError(
            'Payment requires additional verification. Please try again.'
          );
        } else if (paymentIntent.status === 'processing') {
          setError('Payment is being processed. Please wait...');
        } else {
          setError(`Payment status: ${paymentIntent.status}`);
        }
      } else {
        setError('No payment response received');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Gift Summary */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Cadeau Details</h3>
            <p className="text-sm text-muted-foreground">
              Voor: {recipientEmail}
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-background/50 rounded-xl p-4 border-l-4 border-primary mb-4">
            <p className="text-foreground italic">"{message}"</p>
          </div>
        )}

        {/* Payment Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Cadeau bedrag:</span>
            <span className="font-semibold text-sm">
              €{(giftAmount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Service fee:</span>
            <span className="font-semibold text-sm">
              €{(platformFee / 100).toFixed(2)}
            </span>
          </div>
          <div className="border-t border-border/30 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-foreground">Totaal:</span>
              <span className="text-base font-bold text-primary">
                €{(totalAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <label className="block text-sm font-medium text-foreground mb-4">
          Betaalmethode
        </label>
        <div className="[&_.StripeElement]:!bg-transparent [&_iframe]:!bg-transparent">
          <PaymentElement
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: true,
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!isPaymentElementReady && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl">
          Payment form is loading...
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl font-medium hover:bg-muted/50 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug
        </button>
        <button
          type="submit"
          disabled={!stripe || !isPaymentElementReady || isProcessing}
          className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span className="text-sm">Bezig met betalen...</span>
            </>
          ) : (
            <>
              <Euro className="h-5 w-5" />
              <span className="text-sm">
                Betalen €{(totalAmount / 100).toFixed(2)}
              </span>
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
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    giftAmount: number;
    platformFee: number;
    totalAmount: number;
    recipientEmail: string;
    message: string;
    senderEmail: string;
    animationPreset: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const senderEmail = searchParams.get('sender');
    const recipientEmail = searchParams.get('recipient');
    const message = searchParams.get('message');
    const animationPreset = searchParams.get('animation_preset');

    if (!amount || !currency || !senderEmail || !recipientEmail) {
      setError('Missing required payment information');
      setIsLoading(false);
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payment-intent/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseInt(amount),
            currency,
            senderEmail,
            recipientEmail,
            message: message || '',
            animationPreset: animationPreset || 'confettiRealistic',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setPaymentData({
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId,
            giftAmount: data.giftAmount,
            platformFee: data.platformFee,
            totalAmount: data.totalAmount,
            recipientEmail,
            message: message || '',
            senderEmail,
            animationPreset: animationPreset || 'confettiRealistic',
          });
        } else {
          setError(data.error || 'Failed to create payment intent');
        }
      } catch (err) {
        setError('Failed to create payment intent');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [searchParams]);

  const handleSuccess = () => {
    // Redirect to success page with payment data
    if (paymentData) {
      router.push(
        `/success?payment_intent_id=${paymentData.paymentIntentId}&amount=${paymentData.giftAmount}&currency=eur&recipient=${encodeURIComponent(
          paymentData.recipientEmail
        )}&message=${encodeURIComponent(paymentData.message)}&sender=${encodeURIComponent(
          paymentData.senderEmail
        )}&animation_preset=${encodeURIComponent(paymentData.animationPreset)}`
      );
    }
  };

  const handleCancel = () => {
    router.push('/maak-gift');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Payment form wordt geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200"
          >
            Terug naar Formulier
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No payment data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar Formulier
            </button>
            <HamburgerMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Betaling Voltooien
          </h1>
          <p className="text-muted-foreground">
            Voltooi je betaling om je cadeau te verzenden
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: paymentData.clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3b82f6',
                colorText: '#1f2937',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '12px',
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={paymentData.clientSecret}
            paymentIntentId={paymentData.paymentIntentId}
            giftAmount={paymentData.giftAmount}
            platformFee={paymentData.platformFee}
            totalAmount={paymentData.totalAmount}
            recipientEmail={paymentData.recipientEmail}
            message={paymentData.message}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      </div>
    </div>
  );
}
