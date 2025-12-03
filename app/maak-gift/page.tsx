"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Euro,
  ArrowRight,
  Send,
  Square,
  Pencil,
  Check,
  Gift,
} from "lucide-react";
import BeautifulConfetti from "@/components/BeautifulConfetti";
import {
  ANIMATION_PRESETS,
  executeAnimation,
  stopAllAnimations,
  AnimationPreset,
} from "@/lib/animations";
import { LoaderFiveDemo } from "@/components/ui/shimmerload";
import { CancelConfirmationModal } from "@/components/ui/cancel-confirmation-modal";
import { motion } from "motion/react";

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

// PaymentForm component moved to separate payment page

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "10",
    currency: "eur",
    message: "",
    animationPreset: "confettiRealistic",
  });
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [amountError, setAmountError] = useState("");
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const customInputKeyRef = useRef(0);
  const isFormComplete = formData.amount && formData.amount !== "";
  const animationOptions = Object.keys(ANIMATION_PRESETS) as AnimationPreset[];
  const presetsToRender = animationOptions.slice(0, 4) as AnimationPreset[];
  const renderPresetCard = (
    presetKey: AnimationPreset,
    wrapperClass = "",
    keySuffix = "default"
  ) => {
    const isSelected = formData.animationPreset === presetKey;
    const card = themeCardContent[presetKey] || {
      label: ANIMATION_PRESETS[presetKey].name,
      image: "/maak-gift/algemeen.png",
    };

    return (
      <div
        key={`${presetKey}-${keySuffix}`}
        onClick={() =>
          setFormData((prev) => ({
            ...prev,
            animationPreset: presetKey,
          }))
        }
        className={`${wrapperClass} border rounded-lg p-1 cursor-pointer ${
          isSelected ? "border-secondary" : "border-transparent"
        }`}
      >
        <div className="border border-background border-3 flex items-center justify-center bg-[#DBE3E2] p-4 rounded-lg transition duration-200 flex-col justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              previewAnimationPreset(presetKey);
            }}
            className="mb-4 w-full px-0 py-0 text-base font-normal text-[#4d7d75] underline transition hover:text-[#4d7d75]/80"
          >
            {isPreviewPlaying && previewAnimation === presetKey
              ? "Stop voorbeeld"
              : "Voorbeeld tonen"}
          </button>

          <div className="flex justify-center">
            <div className="h-36 w-36 rounded-full border border-[#4d7d75]/30 bg-transparent overflow-hidden">
              <img
                src={card.image}
                alt={card.label}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 justify-center">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                isSelected
                  ? "border-[#4d7d75] bg-[#4d7d75]"
                  : "border-[#0a3530] bg-transparent"
              }`}
              aria-pressed={isSelected}
            >
              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <div className="text-left">
              <p className="text-base font-normal" style={{ color: "#0a3530" }}>
                {card.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const themeCardContent: Record<
    AnimationPreset,
    { label: string; image: string }
  > = {
    confettiRealistic: { label: "Liefde", image: "/maak-gift/liefde.png" },
    fireworks: { label: "Algemeen", image: "/maak-gift/image.png" },
    customShapes: { label: "Feest", image: "/maak-gift/image.png" },
    schoolPride: { label: "School spirit", image: "/maak-gift/image.png" },
    snow: { label: "Winter", image: "/maak-gift/image.png" },
    stars: { label: "Sterren", image: "/maak-gift/image.png" },
  };

  const createPaymentIntent = async () => {
    if (!isFormComplete || isCreatingPayment) return;

    setIsCreatingPayment(true);
    try {
      const amount = parseFloat(formData.amount);
      const amountInCents = Math.round(amount * 100);

      // Redirect to payment page with form data (no emails needed)
      const params = new URLSearchParams({
        amount: amountInCents.toString(),
        currency: formData.currency,
        message: formData.message,
        animation_preset: formData.animationPreset,
      });

      router.push(`/payment?${params.toString()}`);
    } catch (err) {
      setError(
        "Er is een fout opgetreden bij het voorbereiden van de betaling"
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Removed automatic payment creation - now handled by button click

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

    // Validate amount input
    if (name === "amount") {
      if (value === "") {
        setAmountError("");
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          setAmountError("Voer een geldig bedrag in");
        } else if (numValue < 1) {
          setAmountError("Minimum bedrag is €1,00");
        } else if (numValue > 50) {
          setAmountError("Maximum bedrag is €50,00");
        } else {
          setAmountError("");
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  return (
    <div className="w-full overflow-x-hidden">
      {/* Success Confetti */}
      <BeautifulConfetti
        trigger={showSuccessConfetti}
        variant="mixed"
        onComplete={() => setShowSuccessConfetti(false)}
      />

      <div className="w-full flex flex-col min-h-screen overflow-x-hidden">
        {/* Header matching Figma design */}
        <div className="w-full h-20 flex items-center justify-center bg-primary">
          <div className="flex items-center justify-center">
            <p className="text-2xl font-normal text-background flex items-center gap-2">
              <Gift className="h-6 w-6 text-background" /> MonnieGift
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col flex-1 pt-8 md:pt-12 overflow-x-hidden">
          <div className="flex-1 w-full py-8 md:py-16 space-y-8 md:space-y-12 overflow-x-hidden">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full md:max-w-4xl md:mx-auto px-4"
            >
              <h1 className="text-4xl md:text-7xl text-foreground text-center font-serif">
                Laten we beginnen
              </h1>
            </motion.div>

            <hr className="border-t border-[#4d7d75] my-4 mx-4 md:mx-0" />

            {/* Gift Creation Form */}
            <div className="pt-8 w-full overflow-x-hidden">
              <div className="flex flex-col gap-y-8 md:gap-y-12 md:mx-auto w-full">
                {/* Amount Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="w-full md:max-w-4xl md:mx-auto px-4"
                >
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <span
                      className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm md:text-base font-normal text-foreground"
                      style={{ backgroundColor: "#4d7d75" }}
                    >
                      Stap 1
                    </span>
                    <h2
                      className="text-xl md:text-3xl font-serif"
                      style={{ color: "#ddb17c" }}
                    >
                      Kies het bedrag
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Predefined Amount Buttons */}
                    <div className="flex gap-2">
                      {[5, 10, 15].map((amount) => (
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
                          className={`flex-1 h-14 px-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                            formData.amount === amount.toString()
                              ? "border-[#c8f196] bg-transparent text-foreground"
                              : "border-[#4d7d75] bg-transparent text-foreground hover:border-[#c8f196]"
                          }`}
                        >
                          <Euro className="h-5 w-5" />
                          <span className="text-base md:text-lg font-normal">{amount}</span>
                        </button>
                      ))}
                    </div>

                    {!showCustomAmount ? (
                      /* Custom Amount Button */
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, amount: "" }));
                          customInputKeyRef.current += 1;
                          setShowCustomAmount(true);
                        }}
                        className="w-full h-14 px-4 rounded-lg border-2 border-[#4d7d75] bg-transparent text-foreground/70  transition-all duration-200 hover:border-[#c8f196]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Euro className="h-5 w-5" />
                          <span className="text-base md:text-lg font-normal text-foreground/70">
                            Anders namelijk ...
                          </span>
                        </div>
                      </button>
                    ) : (
                      /* Custom Amount Input */
                      <div className="relative w-full">
                        <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/85" />
                        <input
                          key={`custom-amount-${customInputKeyRef.current}`}
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="Anders namelijk ..."
                          min="1"
                          max="50"
                          step="0.01"
                          required
                          className={`block w-full h-14 pl-12 pr-4 border-2 rounded-lg text-base md:text-lg text-foreground placeholder:text-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#c8f196] focus:border-[#c8f196] ${
                            amountError
                              ? "border-red-400 bg-transparent focus:ring-red-400"
                              : "border-[#4d7d75] bg-transparent"
                          }`}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {showCustomAmount && (
                    <div className="mt-3">
                      {amountError ? (
                        <p className="text-xs text-red-400">{amountError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Minimum €1,00 • Maximum €50,00
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
                <hr className="border-t border-[#4d7d75] my-4 mx-4 md:mx-0" />
                {/* Animation Preset Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full md:max-w-4xl md:mx-auto px-4"
                >
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <span
                      className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm md:text-base font-normal text-foreground"
                      style={{ backgroundColor: "#4d7d75" }}
                    >
                      Stap 2
                    </span>
                    <h2
                      className="text-xl md:text-3xl font-serif"
                      style={{ color: "#ddb17c" }}
                    >
                      Kies het thema
                    </h2>
                  </div>

                  <div className="md:hidden w-full overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                    <div className="flex gap-4 w-max px-4">
                      {presetsToRender.map((presetKey) =>
                        renderPresetCard(
                          presetKey,
                          "w-[13rem] flex-shrink-0 snap-center",
                          "mobile"
                        )
                      )}
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-4 gap-4">
                    {presetsToRender.map((presetKey) =>
                      renderPresetCard(presetKey)
                    )}
                  </div>
                </motion.div>

                <hr className="border-t border-[#4d7d75] my-4 mx-4 md:mx-0" />

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-full md:max-w-4xl md:mx-auto px-4"
                >
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <span
                      className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm md:text-base font-normal text-foreground"
                      style={{ backgroundColor: "#4d7d75" }}
                    >
                      Stap 3
                    </span>
                    <h2
                      className="text-xl md:text-3xl font-serif"
                      style={{ color: "#ddb17c" }}
                    >
                      Je bericht
                    </h2>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Lieve Sem, we zijn zo trots op jou, Kus opa en oma"
                    rows={2}
                    maxLength={120}
                    className=" block w-full resize-none rounded-lg border-2 border-[#4d7d75] bg-transparent px-4 py-3 text-base md:text-lg text-foreground placeholder:text-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#c8f196]                     focus:border-[#c8f196]"
                  />
                </motion.div>

                <hr className="border-t border-[#4d7d75] my-4 mx-4 md:mx-0" />

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

                {/* Cancel Confirmation Modal */}
                <CancelConfirmationModal
                  isOpen={showCancelConfirm}
                  onClose={() => setShowCancelConfirm(false)}
                  onConfirm={() => router.push("/")}
                  message="Al je gegevens gaan verloren"
                />

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-full md:max-w-4xl md:mx-auto px-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-4 sm:items-center"
                >
                  {/* Annuleren Button */}
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full sm:w-auto h-14 px-6 rounded-full border-2 border-[#4d7d75] bg-transparent text-[#4d7d75] text-base md:text-lg font-normal hover:bg-[#4d7d75]/10 focus:outline-none focus:ring-2 focus:ring-[#4d7d75] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Annuleren
                  </button>

                  {/* Volgende stap Button */}
                  <button
                    type="button"
                    onClick={createPaymentIntent}
                    disabled={
                      isLoading || isCreatingPayment || !formData.amount
                    }
                    className="w-full sm:w-auto h-14 px-6 rounded-full border-2 border-[#c8f196] bg-[#c8f196] text-[#0a3530] text-base md:text-lg font-normal hover:bg-[#c8f196]/90 focus:outline-none focus:ring-2 focus:ring-[#c8f196] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading || isCreatingPayment ? (
                      <LoaderFiveDemo
                        text={
                          isCreatingPayment
                            ? "Betaling Voorbereiden..."
                            : "Cadeau Aanmaken..."
                        }
                      />
                    ) : (
                      <>
                        <span>Volgende stap</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
