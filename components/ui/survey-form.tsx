"use client";

import { useState } from "react";
import { X, Star, CheckCircle } from "lucide-react";

interface SurveyFormProps {
  onClose: () => void;
  giftId?: string;
  onSubmitted?: () => void;
}

export function SurveyForm({ onClose, giftId, onSubmitted }: SurveyFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftId,
          rating,
          feedback,
          improvements,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        if (onSubmitted) {
          onSubmitted();
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white border border-input rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 py-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#c8f196] rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-[#0a3530]" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#0a3530] text-center px-4">
              Bedankt voor je feedback!
            </h3>
            <p className="text-xs md:text-sm text-[#0a3530]/70 text-center px-4">
              Je feedback helpt ons MonnieGift te verbeteren.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-input rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-semibold text-[#0a3530]">
              Help ons verbeteren
            </h2>
            <p className="text-xs md:text-sm text-[#0a3530]/70 mt-1">
              Je feedback helpt ons MonnieGift beter te maken
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Rating */}
          <div className="space-y-2 md:space-y-3">
            <label className="text-sm md:text-base font-medium text-[#0a3530]">
              Hoe tevreden ben je met MonnieGift? *
            </label>
            <div className="flex gap-1 md:gap-2 justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 md:p-2 transition-all ${
                    rating && star <= rating
                      ? "text-[#c8f196]"
                      : "text-gray-300 hover:text-[#c8f196]/50"
                  }`}
                >
                  <Star
                    className={`h-6 w-6 md:h-8 md:w-8 ${
                      rating && star <= rating ? "fill-current" : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-[#0a3530]">
              Wat vond je het beste aan MonnieGift?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Vertel ons wat je goed vond..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border-2 border-[#4d7d75] bg-transparent px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-[#0a3530] placeholder:text-[#0a3530]/50 focus:outline-none focus:ring-2 focus:ring-[#c8f196] focus:border-[#c8f196] resize-none"
            />
          </div>

          {/* Improvements */}
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-[#0a3530]">
              Wat kunnen we verbeteren?
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Laat ons weten wat we beter kunnen doen..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border-2 border-[#4d7d75] bg-transparent px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-[#0a3530] placeholder:text-[#0a3530]/50 focus:outline-none focus:ring-2 focus:ring-[#c8f196] focus:border-[#c8f196] resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 h-11 md:h-12 rounded-full border-2 border-[#0a3530] bg-transparent text-[#0a3530] text-sm md:text-base font-normal hover:bg-[#0a3530]/10 transition-all duration-200"
            >
              Overslaan
            </button>
            <button
              type="submit"
              disabled={!rating || isSubmitting}
              className="w-full sm:flex-1 h-11 md:h-12 rounded-full bg-[#c8f196] text-[#0a3530] text-sm md:text-base font-normal hover:bg-[#c8f196]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verzenden..." : "Versturen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
