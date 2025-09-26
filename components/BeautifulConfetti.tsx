'use client';

import { useEffect, useRef } from 'react';
import JSConfetti from 'js-confetti';

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
      jsConfettiRef.current = new JSConfetti();
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
            confettiColors: ['#ff6b6b', '#ff8e8e', '#ffa8a8', '#ffc1c1', '#ffd4d4']
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎'],
            confettiColors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f']
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰'],
            confettiColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟'],
            confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7']
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
            confettiColors: ['#ff6b6b', '#ff8e8e', '#ffa8a8', '#ffc1c1', '#ffd4d4']
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎'],
            confettiColors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f']
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰'],
            confettiColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟'],
            confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7']
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
            confettiColors: ['#ff6b6b', '#ff8e8e', '#ffa8a8', '#ffc1c1', '#ffd4d4']
          };
        
        case 'money':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['💰', '💵', '💎', '🏆'],
            confettiColors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f']
          };
        
        case 'mixed':
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '✨', '🌟', '❤️', '💰', '💎'],
            confettiColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
          };
        
        default: 
          return {
            ...baseConfig,
            emojis: type === 'confetti' ? [] : ['🎉', '🎊', '✨', '🌟', '⭐'],
            confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7']
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
