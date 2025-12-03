'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Smile } from 'lucide-react';
import { SurveyForm } from './survey-form';

interface SurveyButtonProps {
  giftId?: string;
}

export function SurveyButton({ giftId }: SurveyButtonProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if survey has been submitted (stored in localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const submitted = localStorage.getItem(`survey_submitted_${giftId || 'general'}`);
      if (submitted === 'true') {
        setHasSubmitted(true);
      }
    }
  }, [giftId]);

  const handleSurveyClose = () => {
    setShowSurvey(false);
  };

  const handleSurveySubmit = () => {
    // Mark as submitted in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`survey_submitted_${giftId || 'general'}`, 'true');
      setHasSubmitted(true);
    }
  };

  // Don't show button if already submitted
  if (hasSubmitted) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowSurvey(true)}
        className="fixed bottom-1/4 right-0 z-50 w-auto pl-2 pr-1 h-auto bg-[#c8f196] text-[#0a3530] rounded-l-full shadow-lg hover:bg-[#c8f196]/90 transition-all duration-200 flex items-center justify-center group py-4"
        aria-label="Geef feedback"
        title="Help ons verbeteren"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="whitespace-nowrap flex items-center gap-2">Geef feedback <Smile className="h-4 w-4 rotate-90" /></span>
      </button>

      {showSurvey && (
        <SurveyForm
          onClose={handleSurveyClose}
          giftId={giftId}
          onSubmitted={handleSurveySubmit}
        />
      )}
    </>
  );
}

