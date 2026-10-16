import 'server-only';

import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe() {
  if (stripe) {
    return stripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Lesson 26 uses test mode only.
  if (!secretKey?.startsWith('sk_test_')) {
    throw new Error('A Stripe test secret key is required.');
  }

  stripe = new Stripe(secretKey);

  return stripe;
}
