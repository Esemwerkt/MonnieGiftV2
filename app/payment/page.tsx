"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Euro, ArrowLeft, Gift, CheckCircle, ArrowRight, Pencil, X } from "lucide-react";
import Image from "next/image";
import { LoaderFiveDemo } from "@/components/ui/shimmerload";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import { CancelConfirmationModal } from "@/components/ui/cancel-confirmation-modal";

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
  const [error, setError] = useState("");
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setIsPaymentElementReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe or elements not ready:", {
        stripe: !!stripe,
        elements: !!elements,
      });
      return;
    }

    console.log("Submitting payment for:", {
      paymentIntentId,
      giftAmount,
      totalAmount,
    });
    setIsProcessing(true);
    setError("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: "iDEAL Payment",
            },
          },
          return_url: `${window.location.origin}/success?payment_intent_id=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment failed:", error);
        setError(error.message || "Er is een fout opgetreden bij de betaling");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("Payment succeeded:", paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Er is een onverwachte fout opgetreden");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden PaymentElement for Stripe functionality */}
      <div style={{ display: "none" }}>
        <PaymentElement
          options={{
            layout: "accordion",
            defaultValues: {
              billingDetails: {
                name: "",
                email: "",
              },
            },
            fields: {
              billingDetails: {
                name: "never",
                email: "auto",
              },
            },
            paymentMethodOrder: ["ideal"],
            wallets: {
              applePay: "never",
              googlePay: "never",
            },
          }}
          onReady={() => setIsPaymentElementReady(true)}
        />
      </div>

      {/* Custom iDEAL Payment UI */}
      <div className="relative">
        <div className="p-4 border-2 border-[#4d7d75] rounded-lg bg-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/payment-logo/ideal.png"
                alt="iDEAL"
                width={34}
                height={32}
              />
            </div>
            <div className="flex-1">
              <p className="text-lg font-normal text-white/85">iDeal</p>
              <p className="text-sm text-white/85">
                Direct betalen via je bank
              </p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-white/85 flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-[#a1cb6e] rounded-full" />
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

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={onCancel}
        message="Al je gegevens gaan verloren"
      />

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between flex-col md:flex-row flex-col-reverse">
        <button
          type="button"
          onClick={() => setShowCancelConfirm(true)}
          className="h-14 rounded-full border-2 border-[#4d7d75] bg-transparent px-6 text-lg font-normal text-[#4d7d75] transition hover:bg-[#4d7d75]/10 focus:outline-none focus:ring-2 focus:ring-[#4d7d75]"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={
            !stripe || !elements || isProcessing || !isPaymentElementReady
          }
          className="h-14 rounded-full border-2 border-[#c8f196] bg-[#c8f196] px-6 text-lg font-normal text-[#0a3530] transition hover:bg-[#c8f196]/90 focus:outline-none focus:ring-2 focus:ring-[#c8f196] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <LoaderFiveDemo text="Verwerken..." />
          ) : (
            <>
              <span>Volgende stap</span>
              <ArrowRight className="h-5 w-5" />
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

  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [giftAmount, setGiftAmount] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [animationPreset, setAnimationPreset] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");

  const SectionHeading = ({ title }: { title: string }) => (
    <h2 className="text-2xl md:text-3xl font-serif text-[#ddb17c]">
      {title}
    </h2>
  );

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const amount = searchParams.get("amount");
        const currency = searchParams.get("currency") || "eur";
        const message = searchParams.get("message") || "";
        const animationPreset =
          searchParams.get("animation_preset") || "confettiRealistic";

        console.log("Creating payment intent with:", {
          amount,
          currency,
          message,
          animationPreset,
        });

        if (!amount) {
          setError("Geen bedrag opgegeven");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/payment-intent/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
          throw new Error(data.error || "Er is een fout opgetreden");
        }

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setGiftAmount(data.giftAmount);
        setPlatformFee(data.platformFee);
        setTotalAmount(data.totalAmount);
        setMessage(message);
        setEditedMessage(message);
        setAnimationPreset(animationPreset);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError(
          err instanceof Error ? err.message : "Er is een fout opgetreden"
        );
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [searchParams]);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push(
        `/success?payment_intent_id=${paymentIntentId}&amount=${giftAmount}&currency=eur&message=${encodeURIComponent(
          message
        )}&animation_preset=${animationPreset}`
      );
    }, 2000);
  };

  const handleCancel = () => {
    router.push("/maak-gift");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderFiveDemo text="Betaling voorbereiden..." />
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
          <h1 className="text-xl font-semibold text-foreground">
            Betaling mislukt
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/maak-gift")}
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
          <h1 className="text-xl font-semibold text-foreground">
            Betaling succesvol!
          </h1>
          <p className="text-muted-foreground">
            Je wordt doorgestuurd naar de succespagina...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full text-white "
    >
      <header className="w-full bg-primary">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-center">
          <p className="flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <Gift className="h-6 w-6 text-primary-foreground" />
            MonnieGift
          </p>
        </div>
      </header>

      <main className="w-full pt-20 pb-16">
        {/* Main Title */}
        <div className="w-full text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-serif text-white/85">
            Controleren en betalen
          </h1>
        </div>

        {/* Divider */}
        <hr className="border-t border-[#4d7d75] mb-8 w-full" />

        {/* Main Content */}
        <div className="w-full md:max-w-4xl md:mx-auto flex flex-col px-4 gap-8">
          {/* Section 1: Uw Monniegift */}
          <section>
            <SectionHeading title="Uw Monniegift" />
            <div className="mt-4 p-4 bg-[#4d7d75] rounded-lg">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white/85">Cadeaubedrag</span>
                  <span className="text-lg text-white/85">
                    €{(giftAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white/85">Servicekosten</span>
                  <span className="text-lg text-white/85">
                    €{(platformFee / 100).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-white/85 pt-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white/85">
                    Totaal te betalen 
                  </span>
                  <span className="text-lg text-white/85">
                    €{(totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Persoonlijk bericht */}
          {message && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionHeading title="Persoonlijk bericht" />
                {!isEditingMessage && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingMessage(true);
                      setEditedMessage(message);
                    }}
                    className="p-2 text-white/85 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    aria-label="Edit message"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="p-4 bg-[#4d7d75] rounded-lg">
                {isEditingMessage ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      maxLength={120}
                      rows={1}
                      className="bg-background block w-full resize-none rounded-lg border-2  px-4 py-3 text-lg text-foreground placeholder:text-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#c8f196] focus:border-[#c8f196]"
                      placeholder="Lieve Sem, we zijn zo trots op jou, Kus opa en oma"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        {editedMessage.length}/120
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingMessage(false);
                            setEditedMessage(message);
                          }}
                          className="px-4 py-2 rounded-lg border border-white/30 text-white/85 hover:bg-white/10 transition-colors text-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMessage(editedMessage);
                            setIsEditingMessage(false);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#c8f196] text-[#0a3530] hover:bg-[#c8f196]/90 transition-colors text-sm font-medium"
                        >
                          Opslaan
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg text-white/85">{message}</p>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Betaalmethode */}
          <section>
            <SectionHeading title="Betaalmethode" />
            <div className="mt-4">
              {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "hsl(var(--primary))",
                      colorBackground: "hsl(var(--background))",
                      colorText: "hsl(var(--foreground))",
                      colorDanger: "hsl(var(--destructive))",
                      fontFamily: "system-ui, sans-serif",
                      spacingUnit: "8px",
                      borderRadius: "12px",
                      fontSizeBase: "16px",
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
          </section>
        </div>
      </main>
    </div>
  );
}
