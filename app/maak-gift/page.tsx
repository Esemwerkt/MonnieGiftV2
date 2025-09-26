"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Euro,
  Mail,
  MessageSquare,
  ArrowRight,
  Send,
  Home,
  Play,
  Square,
  Pencil,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import HamburgerMenu from "@/components/HamburgerMenu";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import BeautifulConfetti from "@/components/BeautifulConfetti";
import {
  ANIMATION_PRESETS,
  executeAnimation,
  stopAllAnimations,
  AnimationPreset,
} from "@/lib/animations";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Message templates based on animation presets
const getMessageTemplates = (animationPreset: string): string[] => {
  const templates: Record<string, string[]> = {
    confettiRealistic: ["Gefeliciteerd!", "Veel geluk!", "Proost!"],
    fireworks: ["Spectaculair!", "Wat een feest!", "Geniet ervan!"],
    customShapes: ["Spooky!", "Boo!", "Trick or treat!"],
    schoolPride: ["Go team!", "School spirit!", "We did it!"],
    snow: ["Winter wonderland!", "Gezellig!", "Blijf warm!"],
    stars: ["Je bent een ster!", "Schijn helder!", "Magisch!"],
  };

  return (
    templates[animationPreset] || ["Gefeliciteerd!", "Veel geluk!", "Proost!"]
  );
};

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

    const paymentElement = elements.getElement("payment");
    if (paymentElement) {
      paymentElement.on("ready", () => {
        setIsPaymentElementReady(true);
      });

      paymentElement.on("change", (event) => {
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

    const paymentElement = elements.getElement("payment");

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
          return_url: `${
            window.location.origin
          }/success?gift_id=${giftId}&amount=${giftAmount}&currency=eur&recipient=${encodeURIComponent(
            recipientEmail
          )}&message=${encodeURIComponent(message)}`,
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
      <div className="py-4">
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
        <div className="border-t  pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground">Totaal:</span>
            <span className="text-base font-bold text-primary">
              €{(totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="py-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          Betaalmethode
        </label>
        <div className="[&_.StripeElement]:!bg-transparent [&_iframe]:!bg-transparent">
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
            <span className="text-sm">
              Betalen €{(totalAmount / 100).toFixed(2)}
            </span>
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
    animationPreset: "",
  });
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    giftId: string;
    giftAmount: number;
    platformFee: number;
    totalAmount: number;
  } | null>(null);
  const [emailErrors, setEmailErrors] = useState<{
    senderEmail: string;
    recipientEmail: string;
  }>({
    senderEmail: "",
    recipientEmail: "",
  });
  const [touchedEmails, setTouchedEmails] = useState<{
    senderEmail: boolean;
    recipientEmail: boolean;
  }>({
    senderEmail: false,
    recipientEmail: false,
  });

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormComplete =
    formData.amount &&
    formData.senderEmail &&
    formData.recipientEmail &&
    isValidEmail(formData.senderEmail) &&
    isValidEmail(formData.recipientEmail);

  const createPaymentIntent = async () => {
    if (!isFormComplete || paymentData || isCreatingPayment) return;

    setIsCreatingPayment(true);
    try {
      const amount = parseFloat(formData.amount);
      const amountInCents = Math.round(amount * 100);

      console.log('Current formData state:', formData);
      console.log('Sending form data:', {
        ...formData,
        amount: amountInCents,
      });

      // Double-check the animationPreset before sending
      if (formData.animationPreset === 'confettiRealistic') {
        console.warn('WARNING: animationPreset is still confettiRealistic! This might be the issue.');
      }

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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors immediately when user starts typing valid email
    if (name === "senderEmail" || name === "recipientEmail") {
      if (value && isValidEmail(value)) {
        setEmailErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    }
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Mark the field as touched
    setTouchedEmails((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate email only if it's not empty
    if (value && !isValidEmail(value)) {
      setEmailErrors((prev) => ({
        ...prev,
        [name]: "Voer een geldig e-mailadres in",
      }));
    } else {
      setEmailErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const previewAnimationPreset = async (preset: AnimationPreset) => {
    if (typeof window === "undefined") return;

    // Check if this animation is currently playing BEFORE we reset anything
    const isCurrentlyPlaying = isPreviewPlaying && previewAnimation === preset;

    // Always stop any currently playing animation first
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }

    // Stop all confetti animations (including requestAnimationFrame ones)
    stopAllAnimations();

    const confetti = (await import("canvas-confetti")).default;
    confetti.reset();

    if (isCurrentlyPlaying) {
      // If this animation was playing, stop it
      setIsPreviewPlaying(false);
      setPreviewAnimation(null);
    } else {
      // Start the new animation
      setIsPreviewPlaying(true);
      setPreviewAnimation(preset);

      const playAnimation = () => {
        executeAnimation(confetti, preset);
      };

      // Play immediately
      playAnimation();

      // Set up interval to loop every 2 seconds
      previewIntervalRef.current = setInterval(playAnimation, 2000);
    }
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
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b  px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar home</span>
            </button>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">MonnieGift</span>
            </div>
            <HamburgerMenu />
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 px-0 py-6 space-y-6">
          {/* Header */}
          <div className="text-left  px-4 flex items-center gap-2">
            <div className="">
              <Gift className="h-8 w-8 text-chart-1" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed ">
              Maak iemand blij met een persoonlijk geldcadeau.
              <br />
              <span className="text-primary text-xs font-medium">
                Veilig, snel en direct overgemaakt.
              </span>
            </p>
          </div>

          {/* Gift Creation Form */}
          <div className=" backdrop-blur-sm rounded-2xl">
            <div className="gap-y-12 flex flex-col">
              {/* Amount Selection */}
              <div className=" px-4">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Bedrag
                </label>

                <div className="flex gap-3 items-center h-[60px]">
                  {!showCustomAmount ? (
                    <>
                      {/* Predefined Amount Buttons - Mobile optimized */}
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        {[5, 10, 25].map((amount) => (
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
                            className={`h-[48px] px-3 rounded-xl border transition-all duration-200 ${
                              formData.amount === amount.toString()
                                ? "bg-primary text-primary-foreground border-primary "
                                : "bg-background border-input hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Euro className="h-4 w-4" />
                              <span className="font-semibold text-sm">
                                {amount}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Amount Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomAmount(true);
                          setFormData((prev) => ({ ...prev, amount: "" }));
                        }}
                        className="h-[48px] px-4 rounded-xl border transition-all duration-200 bg-background border-input hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Pencil className="h-4 w-4" />
                          <span className="font-medium text-sm">Aangepast</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Custom Amount Input */}
                      <div className="relative flex-1">
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
                          className="block w-full h-[48px] pl-12 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          autoFocus
                        />
                      </div>

                      {/* Close Custom Amount Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomAmount(false);
                          setFormData((prev) => ({ ...prev, amount: "" }));
                        }}
                        className="h-[48px] px-4 rounded-xl border transition-all duration-200 bg-background border-input hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Square className="h-4 w-4" />
                          <span className="font-medium text-sm">Sluit</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>

                {/* Help text - only show when custom amount is active */}
                {showCustomAmount && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Minimum €1,00 • Maximum €50,00
                  </p>
                )}
              </div>

              <div className=" px-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Recipient Email */}
                <div>
                  <label
                    htmlFor="recipientEmail"
                    className="block text-sm font-medium text-foreground mb-3"
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
                      onBlur={handleEmailBlur}
                      placeholder="ontvanger@email.nl"
                      required
                      className={`block w-full pl-12 pr-4 py-3 border bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        formData.recipientEmail &&
                        isValidEmail(formData.recipientEmail)
                          ? "border-emerald-500 focus:ring-emerald-500"
                          : touchedEmails.recipientEmail &&
                            emailErrors.recipientEmail
                          ? "border-red-400 focus:ring-red-400"
                          : "border-input"
                      }`}
                    />
                  </div>
                  {touchedEmails.recipientEmail &&
                    emailErrors.recipientEmail && (
                      <p className="text-xs text-red-400 mt-2">
                        {emailErrors.recipientEmail}
                      </p>
                    )}
                </div>

                {/* Sender Email */}
                <div>
                  <label
                    htmlFor="senderEmail"
                    className="block text-sm font-medium text-foreground mb-3"
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
                      onBlur={handleEmailBlur}
                      placeholder="jouw@email.nl"
                      required
                      className={`block w-full pl-12 pr-4 py-3 border bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        formData.senderEmail &&
                        isValidEmail(formData.senderEmail)
                          ? "border-emerald-500 focus:ring-emerald-500"
                          : touchedEmails.senderEmail && emailErrors.senderEmail
                          ? "border-red-400 focus:ring-red-400"
                          : "border-input"
                      }`}
                    />
                  </div>
                  {touchedEmails.senderEmail && emailErrors.senderEmail && (
                    <p className="text-xs text-red-400 mt-2">
                      {emailErrors.senderEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Animation Preset Selection */}
              <div className="">
                <label className="px-4 block text-sm font-medium text-foreground mb-3">
                  Kies een animatie voor de ontvanger
                </label>
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.5}
                  navigation={true}
                  pagination={{ clickable: true }}
                  breakpoints={{
                    640: {
                      slidesPerView: 1.5,
                      spaceBetween: 16,
                    },
                    768: {
                      slidesPerView: 2,
                      spaceBetween: 16,
                    },
                    1024: {
                      slidesPerView: 3,
                      spaceBetween: 16,
                    },
                  }}
                  className="animation-swiper px-4"
                >
                  {Object.entries(ANIMATION_PRESETS).map(([key, preset]) => (
                    <SwiperSlide key={key}>
                      <div
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 h-full ${
                          formData.animationPreset === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <div className="text-base sm:text-lg mb-3">
                          {preset.name}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Selecting animation preset:', key);
                              setFormData((prev) => {
                                const newData = {
                                  ...prev,
                                  animationPreset: key,
                                };
                                console.log('Updated formData:', newData);
                                return newData;
                              });
                            }}
                            className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-md transition-colors ${
                              formData.animationPreset === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {formData.animationPreset === key
                              ? "Geselecteerd"
                              : "Selecteer"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              previewAnimationPreset(key as AnimationPreset)
                            }
                            className="px-3 py-2 text-xs sm:text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center min-w-[40px]"
                          >
                            {isPreviewPlaying && previewAnimation === key ? (
                              <Square className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Message */}
              <div className=" px-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-3"
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
                    rows={5}
                    maxLength={120}
                    className="block w-full pl-12 pr-4 py-3 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  />

                  {/* Message Templates */}
                  <div className="absolute bottom-2 left-2">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Snelle berichten
                    </p>
                    <div className="flex gap-1">
                      {getMessageTemplates(formData.animationPreset).map(
                        (template, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                message: template,
                              }));
                            }}
                            className="px-2 py-1 text-[10px] bg-primary/10 text-primary border border-primary rounded-md hover:bg-primary/20 transition-colors"
                          >
                            {template}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {formData.message.length}/120 karakters
                </p>
              </div>

              {/* Payment Form - Show when form is complete */}
              {isFormComplete && (
                <div className="border-t  pt-6 px-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Je bent er bijna!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Voltooi je betaling om je MonnieGift te versturen
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
                            colorText: "#1f2937",
                            colorDanger: "#ef4444",
                            fontFamily: "system-ui, sans-serif",
                            spacingUnit: "0px",
                            borderRadius: "12px",
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
                            const emailResponse = await fetch(
                              "/api/send-gift-email",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  giftId: paymentData.giftId,
                                }),
                              }
                            );

                            if (emailResponse.ok) {
                            } else {
                            }
                          } catch (emailError) {}

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
              <div className=" px-4">
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
          </div>

          {/* Security Note */}
          <div className="text-center  px-4 py-4">
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Check className="h-4 w-4" /> Geen account nodig • Directcheck
              verzonden
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Uitbetaling via ABN AMRO • Service fee: €0,99 per gift
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
