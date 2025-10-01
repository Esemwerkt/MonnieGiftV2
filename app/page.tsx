"use client";

import { useState, useEffect, useRef } from "react";
import { Gift, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import Lottie from "lottie-react";
import bearAnimation from "@/public/animation-hero/bear.json";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { SparklesText } from "@/components/ui/sparkles-text";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const fireworksIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Start fireworks animation loop only in preview section
  useEffect(() => {
    if (!mounted) return;

    const startFireworks = async () => {
      const confetti = (await import("canvas-confetti")).default;

      const playFireworks = () => {
        // Get the preview section element
        const previewSection = document.getElementById("preview-section");
        if (!previewSection) return;

        // Get the bounding rectangle of the preview section
        const rect = previewSection.getBoundingClientRect();

        // Calculate center position within the preview section
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // Create fireworks animation centered on the preview section
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x, y },
          colors: [
            "#d4b483",
            "#556b68",
            "#0a2d27",
            "#96ceb4",
            "#feca57",
            "#ff9ff3",
          ],
        });

        // Add a second burst for more effect
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { x, y },
            colors: [
              "#d4b483",
              "#556b68",
              "#0a2d27",
              "#96ceb4",
              "#feca57",
              "#ff9ff3",
            ],
          });
        }, 200);
      };

      // Play immediately
      playFireworks();

      // Set up interval to loop every 3 seconds
      fireworksIntervalRef.current = setInterval(playFireworks, 3000);
    };

    // Add a small delay to ensure the preview section is rendered
    const timer = setTimeout(startFireworks, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (fireworksIntervalRef.current) {
        clearInterval(fireworksIntervalRef.current);
      }
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      <div className="w-full mx-auto max-w-4xl flex flex-col relative z-10">
        {/* Main Content - Scrollable */}
        <main className="flex-1 px-0 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="py-12 text-center max-w-6xl mx-auto px-4">
            {/* Main Heading */}
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <SparklesText
                className="text-4xl xs:text-5xl sm:text-6xl  font-bold text-foreground leading-tight"
                sparklesCount={6}
                colors={{ first: "#d4b483", second: "#556b68" }}
              >
                Maak iemand blij met een{" "}
                <span className="text-primary">MonnieGift</span>
              </SparklesText>
            </div>

            {/* Chat Balloon */}
            <div className="-mb-6 flex justify-center ">
              <div className="relative rotate-12 -right-14">
                {/* Balloon */}
                <div className="bg-white rounded-2xl px-3 py-2 shadow-lg">
                  <TypingAnimation
                    className="text-xs font-bold  text-background"
                    duration={80}
                    delay={1000}
                  >
                    Geld cadeau geven is makkelijk!
                  </TypingAnimation>
                </div>
                {/* Tail */}
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                </div>
                {/* Tail border */}
                <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-9 border-r-9 border-t-9 border-l-transparent border-r-transparent"></div>
                </div>
              </div>
            </div>

            {/* Lottie Animation */}
            <div className="-mb-6  flex justify-center">
              <div className="w-40 h-40">
                <Lottie
                  animationData={bearAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-12 ">
                <Link
                  href="/maak-gift"
                  className="border group inline-flex items-center gap-3 sm:gap-4 px-8  py-4  bg-primary text-primary-foreground rounded-xl sm:rounded-2xl hover:bg-primary/90 transition-all duration-200 font-bold text-lg "
                >
                  Maak een MonnieGift
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 group-hover:translate-x-1 transition-transform" />
                </Link>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
