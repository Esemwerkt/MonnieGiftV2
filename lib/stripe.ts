import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('sk_live_')) {
  throw new Error('Invalid STRIPE_SECRET_KEY format. Must start with sk_test_ or sk_live_');
}

export const stripe = new Stripe(apiKey, {
  apiVersion: '2025-08-27.basil',
});
