'use server';

import { getCheckoutQuote } from '@/features/orders/services/checkout-quote';

import type { CheckoutEstimate } from '@/features/orders/lib/checkout-pricing';

export type CheckoutQuoteResult =
  | {
      success: true;
      quote: CheckoutEstimate;
    }
  | {
      success: false;
      message: string;
    };

const knownErrors = new Set([
  'Sign in is required.',
  'Select a valid shipping address.',
  'Shipping address not found.',
  'Your cart is empty.',
  'Your cart contains unavailable items.',
  'Invalid cart item.',
  'Cart pricing is inconsistent.',
]);

export async function getCheckoutQuoteAction(
  addressUuid: string
): Promise<CheckoutQuoteResult> {
  try {
    const quote = await getCheckoutQuote(addressUuid);

    return {
      success: true,
      quote,
    };
  } catch (error) {
    if (error instanceof Error && knownErrors.has(error.message)) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error('Checkout estimate failed:', error);

    return {
      success: false,
      message: 'Unable to calculate checkout estimate.',
    };
  }
}
