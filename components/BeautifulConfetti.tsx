'use client';

import { useEffect, useRef } from 'react';
import JSConfetti from 'js-confetti';

// Theme colors matching globals.css
const THEME_COLORS = {
  background: '#0a3530',      // Dark green
  primary: '#ddb17c',          // Beige/gold
  secondary: '#c8f196',        // Light green
  accent: '#4d7d75',            // Medium green
  muted: '#DBE3E2',             // Light gray/beige
  foreground: '#ffffff',        // White
};

// Helper function to get theme-based confetti colors
const getThemeConfettiColors = (variant: string) => {
  switch (variant) {
    case 'hearts':
      // Hearts variant using primary and secondary colors
      return [
        THEME_COLORS.primary,
        '#e8c89a',  // Lighter primary
        '#d2a068',  // Darker primary
        THEME_COLORS.secondary,
        '#b8d884',  // Darker secondary
      ];
    
    case 'money':
      // Money variant using primary/gold tones
      return [
        THEME_COLORS.primary,
        '#e8c89a',  // Lighter primary
        '#c9a05a',  // Medium primary
        '#b8904a',  // Darker primary
        '#a7803a',  // Darkest primary
      ];
    
    case 'mixed':
      // Mixed variant using all theme colors
      return [
        THEME_COLORS.primary,
        THEME_COLORS.secondary,
        THEME_COLORS.accent,
        '#a1cb6e',  // Lighter secondary
        '#6b9d8f',  // Lighter accent
        THEME_COLORS.muted,
      ];
    
    default: // celebration
      // Celebration variant using theme colors
      return [
        THEME_COLORS.background,
        THEME_COLORS.accent,
        '#6b9d8f',  // Lighter accent
        THEME_COLORS.primary,
        '#e8c89a',  // Lighter primary
        THEME_COLORS.muted,
      ];
  }
};

interface BeautifulConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  variant?: 'celebration' | 'hearts' | 'money' | 'mixed';
  type?: 'emojis' | 'confetti' | 'mixed';
}

export default function BeautifulConfetti({ 
  trigger, 
  onComplete, 
  variant = 'celebration',
  type = 'mixed'
}: BeautifulConfettiProps) {
  const jsConfettiRef = useRef<JSConfetti | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        jsConfettiRef.current = new JSConfetti();
      } catch (error) {
        console.error('Failed to initialize JSConfetti:', error);
        jsConfettiRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!trigger || !jsConfettiRef.current) return;

    const jsConfetti = jsConfettiRef.current;
    
    // Add error handling for DOM access
    try {
      const getConfettiConfig = (variant: string, type: string) => {
      const baseConfig = {
        emojiSize: 50,
        confettiNumber: 60,
        confettiRadius: 6,
      };

      switch (variant) {
        case 'hearts':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['❤️', '💕', '💖'],
            confettiColors: getThemeConfettiColors('hearts')
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎'],
            confettiColors: getThemeConfettiColors('money')
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰'],
            confettiColors: getThemeConfettiColors('mixed')
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟'],
            confettiColors: getThemeConfettiColors('celebration')
          };
      }
    };

    const config = getConfettiConfig(variant, type);

    const createBursts = () => {
      if (type === 'emojis') {
        jsConfetti.addConfetti({
          ...config,
          confettiNumber: 0,
          emojis: config.emojis,
        });
      } else if (type === 'confetti') {
        jsConfetti.addConfetti({
          ...config,
          emojis: [],
          confettiNumber: config.confettiNumber,
        });
        
        setTimeout(() => {
          jsConfetti.addConfetti({
            ...config,
            emojis: [],
            confettiNumber: Math.floor(config.confettiNumber * 0.5),
          });
        }, 300);
      } else {
        jsConfetti.addConfetti({
          ...config,
          confettiNumber: Math.floor(config.confettiNumber * 0.7),
          emojis: config.emojis,
        });

        setTimeout(() => {
          jsConfetti.addConfetti({
            ...config,
            confettiNumber: Math.floor(config.confettiNumber * 0.4),
            emojis: config.emojis,
          });
        }, 300);
      }
    };

    createBursts();

    setTimeout(() => {
      onComplete?.();
    }, 2000);
    
    } catch (error) {
      console.error('Confetti error:', error);
    }

  }, [trigger, variant, onComplete]);

  return null;
}

export function useBeautifulConfetti() {
  const triggerConfetti = (variant: 'celebration' | 'hearts' | 'money' | 'mixed' = 'celebration', type: 'emojis' | 'confetti' | 'mixed' = 'mixed') => {
    if (typeof window === 'undefined') return;
    
    try {
      const jsConfetti = new JSConfetti();
      
      // Check if JSConfetti was properly initialized
      if (!jsConfetti) {
        console.error('JSConfetti failed to initialize');
        return;
      }

    const getConfettiConfig = (variant: string, type: string) => {
      const baseConfig = {
        emojiSize: 60,
        confettiNumber: 80,
        confettiRadius: 8,
      };

      switch (variant) {
        case 'hearts':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['❤️', '💕', '💖'],
            confettiColors: getThemeConfettiColors('hearts')
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎'],
            confettiColors: getThemeConfettiColors('money')
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰'],
            confettiColors: getThemeConfettiColors('mixed')
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟'],
            confettiColors: getThemeConfettiColors('celebration')
          };
      }
    };

    const config = getConfettiConfig(variant, type);

    if (type === 'emojis') {
      jsConfetti.addConfetti({
        ...config,
        confettiNumber: 0,
        emojis: config.emojis,
      });
    } else if (type === 'confetti') {
      jsConfetti.addConfetti({
        ...config,
        emojis: [],
        confettiNumber: config.confettiNumber,
      });
      
      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          emojis: [],
          confettiNumber: Math.floor(config.confettiNumber * 0.6),
        });
      }, 400);
    } else {
      jsConfetti.addConfetti({
        ...config,
        confettiNumber: Math.floor(config.confettiNumber * 0.8),
        emojis: config.emojis,
      });

      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          confettiNumber: Math.floor(config.confettiNumber * 0.5),
          emojis: config.emojis,
        });
      }, 400);
    }
    
    } catch (error) {
      console.error('Confetti error:', error);
    }
  };

  const triggerFullScreenExplosion = (variant: 'celebration' | 'hearts' | 'money' | 'mixed' = 'celebration', type: 'emojis' | 'confetti' | 'mixed' = 'mixed') => {
    if (typeof window === 'undefined') return;
    
    try {
      const jsConfetti = new JSConfetti();
      
      // Check if JSConfetti was properly initialized
      if (!jsConfetti) {
        console.error('JSConfetti failed to initialize');
        return;
      }

    const getFullScreenConfig = (variant: string, type: string) => {
      const baseConfig = {
        emojiSize: 70,
        confettiNumber: 120,
        confettiRadius: 10,
      };

      switch (variant) {
        case 'hearts':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['❤️', '💕', '💖', '💗'],
            confettiColors: getThemeConfettiColors('hearts')
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎', '🏆'],
            confettiColors: getThemeConfettiColors('money')
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰', '💎'],
            confettiColors: getThemeConfettiColors('mixed')
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟', '⭐'],
            confettiColors: getThemeConfettiColors('celebration')
          };
      }
    };

    const config = getFullScreenConfig(variant, type);

    if (type === 'emojis') {
      jsConfetti.addConfetti({
        ...config,
        confettiNumber: 0,
        emojis: config.emojis,
      });
    } else if (type === 'confetti') {
      jsConfetti.addConfetti({
        ...config,
        emojis: [],
        confettiNumber: config.confettiNumber,
      });
      
      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          emojis: [],
          confettiNumber: Math.floor(config.confettiNumber * 0.7),
        });
      }, 300);

      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          emojis: [],
          confettiNumber: Math.floor(config.confettiNumber * 0.5),
        });
      }, 600);
    } else {
      jsConfetti.addConfetti({
        ...config,
        confettiNumber: Math.floor(config.confettiNumber * 0.8),
        emojis: config.emojis,
      });

      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          confettiNumber: Math.floor(config.confettiNumber * 0.6),
          emojis: config.emojis,
        });
      }, 300);

      setTimeout(() => {
        jsConfetti.addConfetti({
          ...config,
          confettiNumber: Math.floor(config.confettiNumber * 0.4),
          emojis: config.emojis,
        });
      }, 600);
    }
    
    } catch (error) {
      console.error('Confetti error:', error);
    }
  };

  return { triggerConfetti, triggerFullScreenExplosion };
}
