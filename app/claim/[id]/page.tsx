"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Gift,
  CheckCircle,
  ArrowRight,
  Home,
  Mail,
  User,
  CreditCard,
  X,
} from "lucide-react";
import { executeAnimation, AnimationPreset } from "@/lib/animations";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { LoaderFiveDemo } from "@/components/ui/shimmerload";
import AccordionTabsDemo from "@/components/ui/faq";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { CancelConfirmationModal } from "@/components/ui/cancel-confirmation-modal";
import { SurveyForm } from "@/components/ui/survey-form";
import { SurveyButton } from "@/components/ui/survey-button";

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const giftId = params.id as string;

  const [gift, setGift] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<
    "loading" | "verification" | "onboarding" | "claiming" | "success" | "error"
  >("loading");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const confettiRef = useRef<any>(null);

  // Pre-fill authentication code from URL query parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setAuthCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Show survey after successful claim
  useEffect(() => {
    if (step === "success" && gift) {
      // Show survey after 3 seconds delay
      const timer = setTimeout(() => {
        setShowSurvey(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, gift]);

  useEffect(() => {
    if (giftId) {
      fetchGift();
    }
  }, [giftId]);

  // Initialize canvas-confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("canvas-confetti")
        .then((module) => {
          confettiRef.current = module.default;
        })
        .catch((error) => {
          console.error("Failed to initialize canvas-confetti:", error);
        });
    }
  }, []);

  // Trigger animation when confetti should show
  const hasTriggeredAnimation = useRef(false);
  useEffect(() => {
    if (showConfetti && confettiRef.current && !hasTriggeredAnimation.current) {
      hasTriggeredAnimation.current = true;
      // Use gift's animation preset or default to 'confettiRealistic' if missing/invalid
      const validPresets: AnimationPreset[] = [
        "customShapes",
        "schoolPride",
        "snow",
        "stars",
        "fireworks",
        "confettiRealistic",
      ];
      const isValid =
        gift?.animationPreset &&
        validPresets.includes(gift.animationPreset as AnimationPreset);
      const animationToUse = isValid
        ? (gift.animationPreset as AnimationPreset)
        : "confettiRealistic";

      // Pass canvas-confetti function
      executeAnimation(confettiRef.current, animationToUse);
    }
  }, [showConfetti, gift?.animationPreset, gift?.id]);

  const fetchGift = async () => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      if (response.ok) {
        const giftData = await response.json();
        setGift(giftData);
        setStep("verification");
        // Don't show modal automatically, wait for button click
      } else {
        setError("Cadeau niet gevonden");
        setStep("error");
      }
    } catch (err) {
      console.error("Error fetching gift:", err);
      setError("Er is een fout opgetreden");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAuthCode = async (email: string, authCode: string) => {
    setIsCheckingUser(true);
    setError("");

    try {
      const response = await fetch("/api/gifts/verify-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftId,
          email,
          authCode,
        }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        // Auth code is valid, now check user status
        await checkUserStatus(email);
      } else {
        setError(result.error || "Ongeldige authenticatiecode of e-mailadres");
      }
    } catch (err) {
      console.error("Error verifying auth code:", err);
      setError("Er is een fout opgetreden bij het verifiëren van je gegevens");
    } finally {
      setIsCheckingUser(false);
    }
  };

  const checkUserStatus = async (email: string) => {
    try {
      const response = await fetch("/api/check-user-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.status === "existing_stripe_user") {
        // User has Stripe Connect - claim immediately
        await claimGift(result.user.id);
      } else if (result.status === "existing_user_no_stripe") {
        // User exists but needs Stripe Connect onboarding
        await createStripeAccountAndRedirect();
      } else if (result.status === "new_user") {
        // New user - create account and onboard
        await createStripeAccountAndRedirect();
      }
    } catch (err) {
      console.error("Error checking user status:", err);
      setError("Er is een fout opgetreden bij het controleren van je account");
    }
  };

  const createStripeAccountAndRedirect = async () => {
    try {
      // Create a new Stripe Express account
      const accountResponse = await fetch("/api/connect/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          giftId,
        }),
      });

      const accountData = await accountResponse.json();

      if (accountResponse.ok) {
        // Redirect to onboarding with account ID
        window.location.href = `/onboard?email=${encodeURIComponent(
          email
        )}&account_id=${accountData.accountId}&gift_id=${giftId}`;
      } else {
        throw new Error(accountData.error || "Failed to create Stripe account");
      }
    } catch (err) {
      console.error("Error creating Stripe account:", err);
      setError("Er is een fout opgetreden bij het aanmaken van je account");
      setStep("error");
    }
  };

  const claimGift = async (userId: string) => {
    setStep("claiming");

    try {
      const response = await fetch("/api/gifts/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftId,
          userId,
          email,
        }),
      });

      if (response.ok) {
        setStep("success");
        setShowConfetti(true);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Er is een fout opgetreden bij het claimen"
        );
        setStep("error");
      }
    } catch (err) {
      console.error("Error claiming gift:", err);
      setError("Er is een fout opgetreden bij het claimen");
      setStep("error");
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
    const symbol = currency === "eur" ? "€" : currency === "usd" ? "$" : "£";
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  const getRecipientName = () => {
    // Extract name from recipient email or use a default
    if (gift?.recipientEmail) {
      const emailName = gift.recipientEmail.split("@")[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "Je";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderFiveDemo text="Cadeau laden..." />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Gift className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Cadeau niet gevonden
          </h1>
          <p className="text-muted-foreground">{error}</p>
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

  if (step === "success") {
    return (
      <div className="">
        <div className=" w-full">
          {/* Header */}
          <Header />

          {/* Hero Section */}
          <section className="relative w-full overflow-hidden">
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-16 md:py-24">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="/bg-overlay.svg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col items-center gap-4 relative z-1">
             

                {/* Main Heading */}
                <h1 className="text-center text-4xl md:text-7xl max-w-2xl px-4 text-primary font-bold"  style={{ fontFamily: 'Rockwell, serif' }}>
                  Gelukt<br></br>
                  <span className="text-foreground">
                    Je krijgt Monnie op je rekening
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-center text-base text-foreground leading-relaxed md:leading-normal">
                  Het geld is overgemaakt naar jouw account.<br></br>Bedankt
                  voor het gebruiken van MonnieGift!
                </p>

                <div className="w-full max-w-2xl mx-auto h-8 border-t border-foreground/15" />
                <div className="flex justify-center pt-4">
                {/* CTA Button */}
                <Link href="/maak-gift">
                  <Button className="bg-secondary text-background hover:bg-secondary/80 rounded-full px-8 py-3 h-14 text-lg font-normal flex items-center gap-3 max-w-xs justify-center">
                    <img src="/cad.png" alt="Gift Icon" className="w-8 h-8" />
                    <span>Maak een Monniegift</span>
                  </Button>
                </Link>
                
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Survey Form Modal (auto-show after delay) */}
        {showSurvey && (
          <SurveyForm
            onClose={() => setShowSurvey(false)}
            giftId={giftId}
          />
        )}

        {/* Sticky Survey Button */}
        {step === "success" && gift && (
          <SurveyButton giftId={giftId} />
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* Header */}
      <header className="w-full bg-primary">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-center">
          <p className="flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <Gift className="h-6 w-6 text-primary-foreground" />
            MonnieGift
          </p>
        </div>
      </header>

      {/* Hero Section */}
      {gift && step === "verification" && (
        <section className="relative w-full overflow-hidden">
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-16 md:py-24">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="/bg-overlay.svg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col items-center gap-4 relative z-1">
              {/* Main Heading */}
              <h1 className="text-center text-3xl md:text-4xl md:text-7xl max-w-6xl px-3">
               
                <br></br>Je hebt een cadeau <br></br>van{" "}
                <span className="text-primary font-bold">
                  {formatAmount(gift.amount, gift.currency)}
                </span>{" "}
                ontvangen!
              </h1>

              
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      {gift && step === "verification" && (
        <div className="w-full px-4 py-8 md:py-16 !pt-0">
          <div className="w-full md:max-w-4xl md:mx-auto">
            {/* Main Hero Content */}
            <div className="text-center">
              {/* Separator Line */}
              <div className="w-full max-w-2xl mx-auto h-8 border-t border-foreground/15" />

              {/* Bear Animation and Message */}
              <div className="flex items-center flex-col md:flex-row items-center justify-center mt-0 mb-8 gap-6 max-w-2xl mx-auto px-4">
                {/* Bear Animation */}
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src="/hero-icon.png"
                    alt="Gift Box"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Message Box */}
                {gift.message && (
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <p className="text-2xl font-light italic text-foreground/85 leading-relaxed">
                      <TypingAnimation
                        className="text-foreground/85"
                        duration={80}
                        delay={1500}
                      >
                        {gift.message}
                      </TypingAnimation>
                    </p>
                  </div>
                )}
              </div>

              {/* Separator Line */}
              <div className="w-full max-w-2xl mx-auto h-8 border-t border-foreground/15" />

              {/* Claim Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="h-14 px-8 bg-secondary text-secondary-foreground rounded-full font-normal text-xl hover:bg-secondary/90 transition-all duration-200 flex items-center justify-center gap-3"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Haal je cadeau op
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelConfirmModal}
        onClose={() => setShowCancelConfirmModal(false)}
        onConfirm={() => {
          setShowVerificationModal(false);
          setEmail("");
          setAuthCode("");
          setError("");
        }}
        message="Al je gegevens gaan verloren"
      />

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background border border-input rounded-2xl p-6 space-y-6 relative">
            <button
              onClick={() => {
                setShowVerificationModal(false);
                setEmail("");
                setAuthCode("");
                setError("");
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Verifieer je gegevens
              </h2>
              <p className="text-sm text-muted-foreground">
                Voer je e-mailadres en authenticatiecode in om je cadeau te
                claimen.
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
                    className="w-full h-12 pl-12 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                    placeholder="ABC12345"
                    maxLength={8}
                    required
                    className="w-full h-12 pl-12 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-left text-lg tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Voer de 8-karakter code in die je hebt ontvangen
                </p>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isCheckingUser ||
                    !email ||
                    !authCode ||
                    !isValidEmail(email)
                  }
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
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
      )}

      {/* Claiming Step */}
      {step === "claiming" && (
        <div className="w-full px-4 py-12">
          <div className="w-full md:max-w-4xl md:mx-auto">
            <div className="text-center space-y-4 p-8 bg-background/50 border border-input rounded-2xl">
              <LoaderFiveDemo text="Cadeau wordt opgehaald..." />
              <p className="text-muted-foreground text-sm">
                Even geduld, we verwerken je cadeau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promotional Section */}
      {gift && step === "verification" && (
        <section className="w-full bg-[#dbe3e2]">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 py-16">
            {/* Content */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6 w-full md:max-w-none">
                <h2 className="text-3xl md:text-5xl font-normal text-[#0a3530] leading-tight">
                  Veilig geld als cadeau versturen met een digitale ontvangst
                  kaart
                </h2>

                <p className="text-base md:text-lg text-[#0a3530] leading-relaxed">
                  Geen saaie enveloppen meer! Verstuur nu geld als een
                  feestelijk en persoonlijk cadeau, direct via onze app. Voeg
                  een leuke boodschap toe en maak het schenken van geld
                  bijzonder. Download nu en verras iemand met een digitaal
                  cadeau vol mogelijkheden!
                </p>

                <Link href="/maak-gift" className="block">
                  <Button className="bg-[#ddb17c] text-[#0a3530] hover:bg-[#cdac6c] rounded-full w-full md:w-auto px-8 py-3 h-14 text-lg font-normal flex items-center justify-center gap-3">
                    <Gift className="w-8 h-8" />
                    Maak een Monniegift
                  </Button>
                </Link>
              </div>

              {/* Right Image */}
              <div className="relative w-full md:max-w-none mx-auto md:mx-0">
                <div className="w-full h-56 md:h-[440px] rounded-lg overflow-hidden">
                  <img
                    src="/image.png"
                    alt="Safety"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {gift && step === "verification" && (
        <section id="faq" className="w-full">
          <div className="w-full md:max-w-4xl md:mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-5xl font-normal text-center text-[#ddb17c] mb-8 leading-normal">
              Veel gestelde vragen
            </h2>

            <div className="bg-[#4d7d75]/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 w-full mx-auto">
              <AccordionTabsDemo />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
