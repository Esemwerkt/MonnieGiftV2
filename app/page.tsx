"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Euro,
  Mail,
  MessageSquare,
  ArrowRight,
  X,
  Send,
  Home,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import BeautifulConfetti from "@/components/BeautifulConfetti";
import { ANIMATION_PRESETS, AnimationPreset } from "@/lib/animations";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function PaymentForm({
  clientSecret,
  giftId,
  giftAmount,
  platformFee,
  totalAmount,
  recipientEmail,
  message,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  giftId: string;
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
  const [error, setError] = useState("");
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
      setError("Payment system not ready. Please try again.");
      return;
    }

    const paymentElement = elements.getElement('payment');
    
    if (!paymentElement) {
      setError("Payment form not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?gift_id=${giftId}&amount=${giftAmount}&currency=eur&recipient=${encodeURIComponent(recipientEmail)}&message=${encodeURIComponent(message)}`,
        },
        redirect: "if_required",
      });


      if (error) {
        setError(error.message || "Payment failed");
      } else if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          onSuccess();
        } else if (paymentIntent.status === "requires_action") {
          setError(
            "Payment requires additional verification. Please try again."
          );
        } else if (paymentIntent.status === "processing") {
          setError("Payment is being processed. Please wait...");
        } else {
          setError(`Payment status: ${paymentIntent.status}`);
        }
      } else {
        setError("No payment response received");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Summary */}
      <div className="bg-background/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-foreground">Cadeau bedrag:</span>
          <span className="font-semibold text-sm">
            €{(giftAmount / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-foreground">Service fee:</span>
          <span className="font-semibold text-sm">
            €{(platformFee / 100).toFixed(2)}
          </span>
        </div>
        <div className="border-t border-border/50 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground">Totaal:</span>
            <span className="text-base font-bold text-primary">
              €{(totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-background/50 rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          Betaalmethode
        </label>
        <PaymentElement
          options={{
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: true,
            },
          }}
        />
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !isPaymentElementReady || isProcessing}
        className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 "
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span className="text-sm">Bezig met betalen...</span>
          </>
        ) : (
          <>
            <Euro className="h-5 w-5" />
            <span className="text-sm">Betalen €{(totalAmount / 100).toFixed(2)}</span>
          </>
        )}
      </button>

     
    </form>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    currency: "eur",
    message: "",
    senderEmail: "",
    recipientEmail: "",
    animationPreset: "confetti",
  });
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    giftId: string;
    giftAmount: number;
    platformFee: number;
    totalAmount: number;
  } | null>(null);

  const isFormComplete =
    formData.amount && formData.senderEmail && formData.recipientEmail;

  const createPaymentIntent = async () => {
    if (!isFormComplete || paymentData || isCreatingPayment) return;


    setIsCreatingPayment(true);
    try {
      const amount = parseFloat(formData.amount);
      const amountInCents = Math.round(amount * 100);

      const response = await fetch("/api/gifts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: amountInCents,
        }),
      });

      
      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setPaymentData({
          clientSecret: data.clientSecret,
          giftId: data.giftId,
          giftAmount: data.giftAmount,
          platformFee: data.platformFee,
          totalAmount: data.totalAmount,
        });
        setShowPaymentForm(true);
      } else {
        setError(data.error || "Failed to create payment intent");
      }
    } catch (err) {
      setError(
        "Er is een fout opgetreden bij het voorbereiden van de betaling"
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  useEffect(() => {
    if (isFormComplete && !paymentData) {
      createPaymentIntent();
    }
  }, [isFormComplete, paymentData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const previewAnimationPreset = async (preset: AnimationPreset) => {
    if (typeof window === 'undefined') return;
    
    const JSConfetti = (await import('js-confetti')).default;
    const jsConfetti = new JSConfetti();
    const config = ANIMATION_PRESETS[preset];
    
    setPreviewAnimation(preset);
    
    setTimeout(() => {
      jsConfetti.addConfetti({
        confettiColors: config.confettiColors,
        confettiNumber: Math.floor(config.confettiNumber * 0.6),
        confettiRadius: config.confettiRadius,
        emojis: config.emojis,
      });
    }, 100);
    
    setTimeout(() => {
      setPreviewAnimation(null);
    }, 2000);
  };


  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "";
    return `€${(numAmount / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Success Confetti */}
      <BeautifulConfetti
        trigger={showSuccessConfetti}
        variant="mixed"
        onComplete={() => setShowSuccessConfetti(false)}
      />

      {/* Mobile-first container */}
      <div className="w-full mx-auto min-h-screen max-w-4xl flex flex-col">
        {/* Mobile Header - Fixed at top */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/landing")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Over MonnieGift</span>
            </button>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">MonnieGift</span>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 px-4 py-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Cadeau Maken
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Maak iemand blij met een persoonlijk geld cadeau. Veilig, snel en direct overgemaakt.
            </p>
          </div>

          {/* Gift Creation Form */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl">
            <div className="space-y-5">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Bedrag
                </label>

                {/* Predefined Amount Buttons - Mobile optimized */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[5, 10, 25, 50, 75, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          amount: amount.toString(),
                        }));
                        setShowCustomAmount(false);
                      }}
                      className={`py-3 px-3 rounded-xl border transition-all duration-200 ${
                        formData.amount === amount.toString()
                          ? "bg-primary text-primary-foreground border-primary "
                          : "bg-background border-input hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold text-sm">{amount}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomAmount(!showCustomAmount);
                    if (!showCustomAmount) {
                      setFormData((prev) => ({ ...prev, amount: "" }));
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl border transition-all duration-200 ${
                    showCustomAmount
                      ? "bg-primary text-primary-foreground border-primary "
                      : "bg-background border-input hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Euro className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {showCustomAmount
                        ? "Verberg aangepast bedrag"
                        : "Aangepast bedrag"}
                    </span>
                  </div>
                </button>

                {/* Custom Amount Input */}
                {showCustomAmount && (
                  <div className="mt-3">
                    <div className="relative">
                      <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="1"
                        max="100"
                        step="0.01"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum €1,00 • Maximum €100,00
                    </p>
                  </div>
                )}

                {formData.amount && !showCustomAmount && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <p className="text-sm font-medium text-primary text-center">
                      Geselecteerd: €{parseFloat(formData.amount).toFixed(2)}
                    </p>
                  </div>
                )}
            </div>

              {/* Sender Email */}
              <div>
                <label
                  htmlFor="senderEmail"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Jouw E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    id="senderEmail"
                    name="senderEmail"
                    value={formData.senderEmail}
                    onChange={handleInputChange}
                    placeholder="jouw@email.nl"
                    required
                    className="block w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              {/* Recipient Email */}
              <div>
                <label
                  htmlFor="recipientEmail"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Ontvanger E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    id="recipientEmail"
                    name="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                    placeholder="ontvanger@email.nl"
                    required
                    className="block w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Persoonlijk Bericht (optioneel)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Schrijf een persoonlijk bericht..."
                    rows={3}
                    maxLength={500}
                    className="block w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.message.length}/500 karakters
                </p>
              </div>

              {/* Animation Preset Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  🎨 Kies een animatie voor de ontvanger
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'confetti', label: '🎉 Confetti', description: 'Explosie van confetti' },
                    { value: 'hearts', label: '❤️ Hearts', description: 'Harten en liefde' },
                    { value: 'money', label: '💰 Money', description: 'Geld regen' }
                  ].map((preset) => (
                    <div
                      key={preset.value}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        formData.animationPreset === preset.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      <div className="text-lg mb-1">{preset.label}</div>
                      <div className="text-xs text-muted-foreground mb-2">{preset.description}</div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, animationPreset: preset.value }))}
                          className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                            formData.animationPreset === preset.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          Selecteer
                        </button>
                        <button
                          type="button"
                          onClick={() => previewAnimationPreset(preset.value as AnimationPreset)}
                          disabled={previewAnimation === preset.value}
                          className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {previewAnimation === preset.value ? '🎆' : '👁️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Form - Show when form is complete */}
              {isFormComplete && (
                <div className="border-t border-border/50 pt-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Betaling Voltooien
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Voer je kaartgegevens in om het cadeau te verzenden
                    </p>
                  </div>

                {isCreatingPayment ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-muted-foreground">
                        Betaling voorbereiden...
                      </span>
                    </div>
                  </div>
                ) : paymentData ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentData.clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#3b82f6",
                          colorBackground: "transparent",
                          colorText: "#1f2937",
                          colorDanger: "#ef4444",
                          fontFamily: "system-ui, sans-serif",
                          spacingUnit: "4px",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={paymentData.clientSecret}
                      giftId={paymentData.giftId}
                      giftAmount={paymentData.giftAmount}
                      platformFee={paymentData.platformFee}
                      totalAmount={paymentData.totalAmount}
                      recipientEmail={formData.recipientEmail}
                      message={formData.message}
                      onSuccess={async () => {
                        setSuccess(
                          "Betaling succesvol! Cadeau wordt verzonden..."
                        );
                        setShowPaymentForm(false);
                        setShowSuccessConfetti(true);
                        
                        try {
                          const emailResponse = await fetch("/api/send-gift-email", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              giftId: paymentData.giftId,
                            }),
                          });
                          
                          if (emailResponse.ok) {
                          } else {
                          }
                        } catch (emailError) {
                        }
                        
                        setTimeout(() => {
                          router.push(
                            `/success?gift_id=${paymentData.giftId}&amount=${
                              paymentData.giftAmount
                            }&currency=eur&recipient=${encodeURIComponent(
                              formData.recipientEmail
                            )}${
                              formData.message
                                ? `&message=${encodeURIComponent(
                                    formData.message
                                  )}`
                                : ""
                            }`
                          );
                        }, 2000);
                      }}
                      onCancel={() => {
                        setPaymentData(null);
                        setShowPaymentForm(false);
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      Vul alle velden in om de betaling voor te bereiden
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-chart-1/10 border border-chart-1/20 text-chart-1 px-4 py-3 rounded-xl flex items-center gap-2">
                <Send className="h-4 w-4" />
                {success}
              </div>
            )}

              {/* Submit Button - Only show when payment form is not active */}
              {!paymentData && (
                <button
                  type="button"
                  onClick={createPaymentIntent}
                  disabled={
                    isLoading ||
                    isCreatingPayment ||
                    !formData.amount ||
                    !formData.senderEmail ||
                    !formData.recipientEmail
                  }
                  className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {isLoading || isCreatingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span className="text-sm">
                        {isCreatingPayment
                          ? "Betaling Voorbereiden..."
                          : "Cadeau Aanmaken..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Gift className="h-5 w-5" />
                      <span className="text-sm">Cadeau Verzenden</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>


          {/* Security Note */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Veilig betalen via Stripe • Geen account nodig • Direct verzonden
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
