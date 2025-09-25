export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // Monthly price in cents
  currency: string;
  platformFeePercentage: number; // Platform fee percentage (0.5% = 0.005)
  features: string[];
  limits: {
    maxGiftsPerMonth?: number;
    maxGiftAmount?: number; // in cents
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Perfect voor af en toe een cadeau',
    price: 0,
    currency: 'EUR',
    platformFeePercentage: 0.005, // 0.5%
    features: [
      'Onbeperkt cadeaus versturen',
      'Basis ondersteuning',
      '0.5% platform fee',
      'Tot €500 per cadeau',
      'Email notificaties'
    ],
    limits: {
      maxGiftAmount: 50000 // €500
    }
  },
  {
    id: 'paid',
    name: 'Professional',
    description: 'Voor regelmatige gebruikers en bedrijven',
    price: 999, // €9.99
    currency: 'EUR',
    platformFeePercentage: 0.001, // 0.1%
    features: [
      'Onbeperkt cadeaus versturen',
      'Prioriteit ondersteuning',
      '0.1% platform fee (80% korting)',
      'Onbeperkt cadeau bedrag',
      'Uitgebreide analytics',
      'Bulk cadeaus',
      'API toegang',
      '24/7 premium ondersteuning'
    ],
    limits: {
      maxGiftAmount: 10000000 // €100,000
    },
    popular: true
  }
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function getPlanFeatures(planId: string): string[] {
  const plan = getPlanById(planId);
  return plan?.features || [];
}

export function getPlanLimits(planId: string) {
  const plan = getPlanById(planId);
  return plan?.limits || {};
}

export function canSendGift(planId: string, giftAmount: number): { allowed: boolean; reason?: string } {
  const plan = getPlanById(planId);
  if (!plan) {
    return { allowed: false, reason: 'Plan niet gevonden' };
  }

  if (plan.limits.maxGiftAmount && giftAmount > plan.limits.maxGiftAmount) {
    return { 
      allowed: false, 
      reason: `Gift bedrag te hoog. Maximum voor ${plan.name}: €${(plan.limits.maxGiftAmount / 100).toFixed(2)}` 
    };
  }

  return { allowed: true };
}

export function formatPlanPrice(plan: SubscriptionPlan): string {
  if (plan.price === 0) {
    return 'Gratis';
  }
  
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.price / 100);
}
