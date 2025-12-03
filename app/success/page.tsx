"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Gift,
  CheckCircle,
  ArrowRight,
  Home,
  MessageCircle,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { LoaderFiveDemo } from "@/components/ui/shimmerload";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { SurveyForm } from "@/components/ui/survey-form";
import { SurveyButton } from "@/components/ui/survey-button";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [giftData, setGiftData] = useState<{
    id: string;
    amount: number;
    currency: string;
    message?: string;
    authenticationCode: string;
    platformFeeAmount?: number;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [claimUrl, setClaimUrl] = useState("");
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showSurvey, setShowSurvey] = useState(false);

  // Show survey after processing is complete and user has seen the success page
  useEffect(() => {
    if (processingComplete && giftData) {
      // Show survey after 3 seconds delay
      const timer = setTimeout(() => {
        setShowSurvey(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [processingComplete, giftData]);

  const handleCopyLink = async () => {
    if (!claimUrl) return;

    try {
      await navigator.clipboard.writeText(claimUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleCopyCode = async () => {
    if (!giftData?.authenticationCode) return;

    try {
      await navigator.clipboard.writeText(giftData.authenticationCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!giftData || !claimUrl) return;

    const message = `🎁 Ik heb een cadeau van €${(
      giftData.amount / 100
    ).toFixed(2)} voor je gemaakt!\n\n${
      giftData.message ? `Bericht: "${giftData.message}"\n\n` : ""
    }Code: ${
      giftData.authenticationCode
    }\n\nKlik op de link om je cadeau op te halen: ${claimUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = async () => {
    if (!giftData || !recipientEmail) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setEmailError("Voer een geldig e-mailadres in");
      return;
    }

    setIsSendingEmail(true);
    setEmailError("");

    try {
      const response = await fetch("/api/send-gift-email-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftId: giftData.id,
          recipientEmail: recipientEmail,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setRecipientEmail("");
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        const errorData = await response.json();
        setEmailError(errorData.error || "Kon e-mail niet verzenden");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      setEmailError("Er is een fout opgetreden bij het verzenden");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === "eur" ? "€" : currency === "usd" ? "$" : "£";
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  useEffect(() => {
    const paymentIntentId =
      searchParams.get("payment_intent") ||
      searchParams.get("payment_intent_id");
    const amount = searchParams.get("amount");
    const currency = searchParams.get("currency");
    const message = searchParams.get("message");
    const animationPreset = searchParams.get("animation_preset");

    if (paymentIntentId) {
      console.log("Using payment intent ID:", paymentIntentId);
      // First verify the payment with Stripe server-side
      const verifyPayment = async (retryCount = 0) => {
        try {
          console.log(
            "Verifying payment:",
            paymentIntentId,
            "attempt:",
            retryCount + 1
          );
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentIntentId }),
          });

          const verificationResult = await response.json();

          if (!response.ok) {
            if (response.status === 429) {
              const retryAfter = verificationResult.retryAfter || 30;
              console.log(`Rate limited, retrying in ${retryAfter} seconds...`);
              setTimeout(() => {
                verifyPayment(retryCount);
              }, retryAfter * 1000);
              return;
            }

            // If payment not completed and we haven't retried too many times, wait and retry
            if (
              verificationResult.status === "requires_payment_method" &&
              retryCount < 5
            ) {
              console.log(
                `Payment not completed yet (${
                  verificationResult.status
                }), retrying in 3 seconds... (attempt ${retryCount + 1}/5)`
              );
              setTimeout(() => {
                verifyPayment(retryCount + 1);
              }, 3000);
              return;
            }

            console.error("Payment verification failed:", verificationResult);
            setProcessingError(true);
            setProcessingComplete(true);
            return;
          }

          const verifiedAmount = verificationResult.paymentIntent.amount;
          const verifiedCurrency = verificationResult.paymentIntent.currency;
          const verifiedMetadata = verificationResult.paymentIntent.metadata;

          const verifiedMessage = verifiedMetadata?.message || "";
          const verifiedAnimationPreset =
            verifiedMetadata?.animationPreset || "confettiRealistic";

          console.log("Payment verified successfully:", {
            amount: verifiedAmount,
            currency: verifiedCurrency,
            message: verifiedMessage,
            animationPreset: verifiedAnimationPreset,
          });

          // Now process the gift with verified data
          processGiftWithVerifiedData({
            paymentIntentId,
            amount: verifiedAmount,
            currency: verifiedCurrency,
            message: verifiedMessage,
            animationPreset: verifiedAnimationPreset,
          });
        } catch (error) {
          console.error("Payment verification error:", error);
          setProcessingError(true);
          setProcessingComplete(true);
        }
      };
      verifyPayment();
    }
  }, [searchParams]);

  const processGiftWithVerifiedData = async (verifiedData: {
    paymentIntentId: string;
    amount: number;
    currency: string;
    message: string;
    animationPreset: string;
  }) => {
    const { paymentIntentId, amount, currency, message, animationPreset } =
      verifiedData;

    // Check if processing was already completed for this payment intent
    const processingKey = `gift_processed_${paymentIntentId}`;
    const wasProcessed = sessionStorage.getItem(processingKey);

    if (wasProcessed) {
      console.log(
        "Processing already complete for this payment intent, fetching existing data..."
      );
      // Fetch the existing gift data and display it
      const fetchExistingGift = async () => {
        try {
          const response = await fetch(
            `/api/gifts/by-payment-intent/${paymentIntentId}`
          );
          if (response.ok) {
            const gift = await response.json();
            console.log("Found existing gift:", gift);

            const newGiftData = {
              id: gift.id,
              amount: gift.amount, // Use gift amount from database (without platform fee)
              currency: gift.currency,
              message: gift.message || undefined,
              authenticationCode: gift.authenticationCode,
              platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
            };

            setGiftData(newGiftData);

            // Generate claim URL with authentication code
            const baseUrl = window.location.origin;
            const claimLink = `${baseUrl}/claim/${gift.id}?code=${gift.authenticationCode}`;
            setClaimUrl(claimLink);

            setProcessingComplete(true);
            console.log("Existing gift data loaded successfully");
          } else {
            console.error("Failed to fetch existing gift:", response.status);
            // Clear sessionStorage if gift doesn't exist (previous processing failed)
            sessionStorage.removeItem(processingKey);
            console.log("Cleared sessionStorage, will retry processing");
          }
        } catch (error) {
          console.error("Error fetching existing gift:", error);
          setProcessingError(true);
          setProcessingComplete(true);
        }
      };
      fetchExistingGift();
    } else {
      // First time processing - try to get gift from webhook
      console.log("First time processing, checking for gift...");
      try {
        const response = await fetch(
          `/api/gifts/by-payment-intent/${paymentIntentId}`
        );

        if (response.ok) {
          const gift = await response.json();
          console.log("Found gift:", gift);

          const newGiftData = {
            id: gift.id,
            amount: gift.amount, // Use gift amount from database (without platform fee)
            currency: gift.currency,
            message: gift.message || undefined,
            authenticationCode: gift.authenticationCode,
          };

          setGiftData(newGiftData);

          // Generate claim URL with authentication code
          const baseUrl = window.location.origin;
          const claimLink = `${baseUrl}/claim/${gift.id}?code=${gift.authenticationCode}`;
          setClaimUrl(claimLink);

          setProcessingComplete(true);
          sessionStorage.setItem(processingKey, "true");
          console.log("Gift retrieved successfully");
        } else {
          console.error("Failed to retrieve gift:", response.status);
          // Webhook might not have fired yet, wait and try again
          console.log("Webhook might not have fired yet, waiting 3 seconds...");
          setTimeout(async () => {
            try {
              const retryResponse = await fetch(
                `/api/gifts/by-payment-intent/${paymentIntentId}`
              );
              if (retryResponse.ok) {
                const gift = await retryResponse.json();
                console.log("Found gift on retry:", gift);

                const newGiftData = {
                  id: gift.id,
                  amount: gift.amount, // Use gift amount from database (without platform fee)
                  currency: gift.currency,
                  message: gift.message || undefined,
                  authenticationCode: gift.authenticationCode,
                  platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
                };

                setGiftData(newGiftData);

                const baseUrl = window.location.origin;
                const claimLink = `${baseUrl}/claim/${gift.id}?code=${gift.authenticationCode}`;
                setClaimUrl(claimLink);

                setProcessingComplete(true);
                sessionStorage.setItem(processingKey, "true");
                console.log("Gift retrieved successfully on retry");
              } else {
                console.error("Still no gift found after retry");
                console.log(
                  "Webhook failed to create gift, attempting fallback creation..."
                );

                // Fallback: Create gift manually using the gifts/create endpoint
                try {
                  const createResponse = await fetch("/api/gifts/create", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      amount: amount,
                      currency: currency,
                      message: message,
                      animationPreset: animationPreset,
                      paymentIntentId: paymentIntentId,
                    }),
                  });

                  if (createResponse.ok) {
                    const createResult = await createResponse.json();
                    console.log(
                      "Fallback gift creation successful:",
                      createResult
                    );

                    // Fetch the newly created gift
                    const giftResponse = await fetch(
                      `/api/gifts/by-payment-intent/${paymentIntentId}`
                    );
                    if (giftResponse.ok) {
                      const gift = await giftResponse.json();
                      console.log("Found newly created gift:", gift);

                      const newGiftData = {
                        id: gift.id,
                        amount: gift.amount,
                        currency: gift.currency,
                        message: gift.message || undefined,
                        authenticationCode: gift.authenticationCode,
                        platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
                      };

                      setGiftData(newGiftData);

                      const baseUrl = window.location.origin;
                      const claimLink = `${baseUrl}/claim/${gift.id}?code=${gift.authenticationCode}`;
                      setClaimUrl(claimLink);

                      setProcessingComplete(true);
                      sessionStorage.setItem(processingKey, "true");
                      console.log(
                        "Fallback gift creation and retrieval successful"
                      );
                    } else {
                      throw new Error("Failed to fetch newly created gift");
                    }
                  } else {
                    const errorData = await createResponse.json();
                    throw new Error(errorData.error || "Failed to create gift");
                  }
                } catch (fallbackError) {
                  console.error(
                    "Fallback gift creation failed:",
                    fallbackError
                  );
                  console.log(
                    "All gift creation methods failed - please contact support"
                  );
                  setProcessingError(true);
                  setProcessingComplete(true);
                  sessionStorage.setItem(processingKey, "true");
                }
              }
            } catch (retryError) {
              console.error("Retry error:", retryError);
              setProcessingError(true);
              setProcessingComplete(true);
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Error processing gift:", error);
        setProcessingError(true);
        setProcessingComplete(true);
      }
    }
  };

  if (!processingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderFiveDemo text="Betaling wordt geverifieerd..." />
        </div>
      </div>
    );
  }

  if (processingError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Verwerking Fout
          </h1>
          <p className="text-muted-foreground">
            Er is een fout opgetreden bij het verwerken van je cadeau. Neem
            contact op met de ondersteuning.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  const SectionHeading = ({ title }: { title: string }) => (
    <h2 className="text-2xl md:text-3xl font-serif text-[#ddb17c]">{title}</h2>
  );

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{ background: "linear-gradient(to bottom, #0a3530, #104b44)" }}
    >
      {/* Header */}
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
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">
            Cadeau succesvol aangemaakt
          </h1>
        </div>

        {/* Divider */}
        <hr className="border-t border-[#4d7d75] mb-8 w-full" />

        {/* Main Content */}
        <div className="w-full md:max-w-4xl md:mx-auto flex flex-col px-4 gap-8">
          {/* Section 1: Cadeau details */}
          {giftData && (
            <section>
              <SectionHeading title="Cadeau details" />
              <div className="mt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-foreground">
                      Cadeaubedrag
                    </span>
                    <span className="text-lg text-foreground">
                      {formatAmount(giftData.amount, giftData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-foreground">
                      Servicekosten
                    </span>
                    <span className="text-lg text-foreground">
                      {formatAmount(
                        giftData.platformFeeAmount || 99,
                        giftData.currency
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-foreground">
                      Totaal betaald
                    </span>
                    <span className="text-lg text-foreground">
                      {formatAmount(
                        giftData.amount + (giftData.platformFeeAmount || 99),
                        giftData.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 2: Persoonlijke boodschap */}
          {giftData?.message && (
            <section>
              <span className="text-lg text-foreground">
                Persoonlijke boodschap
              </span>

              <blockquote className="mt-4 border-l-4 border-accent bg-background p-4 rounded-lg text-base text-foreground font-light italic relative">
                <span className="absolute left-2 top-2 text-accent text-3xl select-none leading-none">“</span>
                <span className="pl-4">{giftData.message}</span>
              </blockquote>
            </section>
          )}

          {/* Section 3: Authenticatie code */}
          {giftData && (
            <section>
              <SectionHeading title="Authenticatie code" />
              <div className="mt-4 space-y-2">
                <p className="text-lg text-foreground">
                  Deel deze code met de ontvanger, de ontvanger heeft deze code
                  nodig om het cadeau op te halen
                </p>
                <div className="p-4 border-2 border-[#4d7d75] rounded-lg bg-transparent">
                  <div className="relative flex items-center">
                    <p className="text-2xl font-normal text-foreground tracking-wider flex-1">
                      {giftData.authenticationCode}
                    </p>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Kopieer code"
                    >
                      {codeCopied ? (
                        <Check className="h-5 w-5 text-[#c8f196]" />
                      ) : (
                        <Copy className="h-5 w-5 text-secondary" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 4: Deel je cadeau */}
          {giftData && claimUrl && (
            <section>
              <SectionHeading title="Deel je cadeau" />
              <div className="mt-4 space-y-4">
                {/* Copy Link Section */}
                <div className="p-4 border-2 border-[#4d7d75] rounded-lg bg-transparent">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={claimUrl}
                      readOnly
                      className="flex-1 bg-transparent text-lg text-foreground focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Kopieer link"
                    >
                      {linkCopied ? (
                        <Check className="h-5 w-5 text-[#c8f196]" />
                      ) : (
                        <Copy className="h-5 w-5 text-secondary" />
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full h-14 rounded-full bg-[#c8f196] text-[#0a3530] font-normal text-lg hover:bg-[#c8f196]/90 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Deel via Whatsapp
                </button>

                {/* Email Share Section */}
                <div className="space-y-2">
                  <p className="text-lg text-foreground">
                    Of verstuur per email
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => {
                          setRecipientEmail(e.target.value);
                          setEmailError("");
                        }}
                        placeholder="Email adres"
                        className="w-full h-14 pl-12 pr-4 border-2 border-[#4d7d75] bg-transparent rounded-lg text-lg text-foreground placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-[#c8f196] focus:border-[#c8f196]"
                      />
                    </div>
                    <button
                      onClick={handleEmailShare}
                      disabled={isSendingEmail || !recipientEmail}
                      className="px-6 h-14 justify-center rounded-full bg-[#ddb17c] text-[#0a3530] font-normal text-lg hover:bg-[#ddb17c]/90 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingEmail ? (
                        <LoaderFiveDemo text="Verzenden..." />
                      ) : emailSent ? (
                        <>
                          Verzonden!
                          <Check className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Versturen
                          <Mail className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                  {emailError && (
                    <p className="text-sm text-red-400 mt-2">{emailError}</p>
                  )}
                  {emailSent && !emailError && (
                    <p className="text-sm text-[#c8f196] mt-2">
                      E-mail succesvol verzonden!
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section 5: Wat gebeurt er nu */}
          <section>
            <SectionHeading title="Wat gebeurt er nu" />
            <div className="mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-lg text-foreground">1</span>
                  <span className="text-lg text-foreground">
                    Verstuur de link via whatsapp of per mail
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-foreground">2</span>
                  <span className="text-lg text-foreground">
                    Ontvanger opent link en voert de authenticatie code in
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-foreground">3</span>
                  <span className="text-lg text-foreground">
                    Ontvanger maakt 1-malig een account aan om uitbetaald te
                    krijgen
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-foreground">4</span>
                  <span className="text-lg text-foreground">
                    Geld wordt overgemaakt
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between flex-col md:flex-row flex-col-reverse">
            <button
              onClick={() => (window.location.href = "/")}
              className="h-14 rounded-full border-2 border-[#ddb17c] bg-transparent text-[#ddb17c] font-normal text-lg hover:bg-[#ddb17c]/10 transition-all duration-200 flex items-center justify-center gap-2 px-6"
            >
              <Home className="h-5 w-5" />
              Terug naar home
            </button>
            <button
              onClick={() => (window.location.href = "/maak-gift")}
              className="h-14 rounded-full bg-[#c8f196] text-[#0a3530] font-normal text-lg hover:bg-[#c8f196]/90 transition-all duration-200 flex items-center justify-center gap-2 px-6"
            >
              <Gift className="h-5 w-5" />
              Maak een MonnieGift
            </button>
          </div>
        </div>
      </main>

      {/* Survey Form Modal (auto-show after delay) */}
      {showSurvey && (
        <SurveyForm
          onClose={() => setShowSurvey(false)}
          giftId={giftData?.id}
        />
      )}

      {/* Sticky Survey Button */}
      {processingComplete && giftData && (
        <SurveyButton giftId={giftData.id} />
      )}
    </div>
  );
}
