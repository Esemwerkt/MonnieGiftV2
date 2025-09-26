export type AnimationPreset = 'confetti' | 'hearts' | 'money';

export interface AnimationConfig {
  variant: 'celebration' | 'hearts' | 'money' | 'mixed';
  type: 'emojis' | 'confetti' | 'mixed';
  emojiSize: number;
  confettiNumber: number;
  confettiRadius: number;
  confettiColors: string[];
  emojis: string[];
}

export const ANIMATION_PRESETS: Record<AnimationPreset, AnimationConfig> = {
  confetti: {
    variant: 'celebration',
    type: 'mixed',
    emojiSize: 60,
    confettiNumber: 80,
    confettiRadius: 8,
    confettiColors: ['#0a2d27', '#d4b483', '#1a584e', '#e4c59a', '#fdfbf7'],
    emojis: ['🎉', '🎊', '✨', '🌟', '⭐']
  },
  hearts: {
    variant: 'hearts',
    type: 'mixed',
    emojiSize: 60,
    confettiNumber: 80,
    confettiRadius: 8,
    confettiColors: ['#ff6b6b', '#ff8e8e', '#ffa8a8', '#ffc1c1', '#ffd4d4'],
    emojis: ['❤️', '💕', '💖', '💗', '💝']
  },
  money: {
    variant: 'money',
    type: 'mixed',
    emojiSize: 60,
    confettiNumber: 80,
    confettiRadius: 8,
    confettiColors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f'],
    emojis: ['💰', '💵', '💎', '🏆', '💸']
  }
};

export const ANIMATION_PRESET_LABELS: Record<AnimationPreset, string> = {
  confetti: '🎉 Confetti Explosion',
  hearts: '❤️ Hearts & Love',
  money: '💰 Money Rain'
};
