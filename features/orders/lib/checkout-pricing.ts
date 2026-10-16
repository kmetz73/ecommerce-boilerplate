const MAX_CENTS = 2_147_483_647;

export type ShippingPolicy = {
  standardShippingCents: number;
  freeShippingThresholdCents: number | null;
};

export type CheckoutEstimate = {
  subtotalCents: number;
  shippingCents: number;
  totalBeforeTaxCents: number;
  taxCents: null;
  totalCents: null;
};

export function calculateCheckoutEstimate(
  subtotalCents: number,
  countryCode: string,
  policy: ShippingPolicy
): CheckoutEstimate {
  // Validate the product subtotal.
  if (
    !Number.isSafeInteger(subtotalCents) ||
    subtotalCents <= 0 ||
    subtotalCents > MAX_CENTS
  ) {
    throw new Error('Invalid checkout subtotal.');
  }

  // Domestic shipping only for this starter.
  if (countryCode !== 'US') {
    throw new Error('Shipping destination is not supported.');
  }

  const { standardShippingCents, freeShippingThresholdCents } = policy;

  // Validate the configured shipping rate.
  if (
    !Number.isSafeInteger(standardShippingCents) ||
    standardShippingCents < 0 ||
    standardShippingCents > MAX_CENTS
  ) {
    throw new Error('Invalid shipping rate.');
  }

  if (
    freeShippingThresholdCents !== null &&
    (!Number.isSafeInteger(freeShippingThresholdCents) ||
      freeShippingThresholdCents <= 0 ||
      freeShippingThresholdCents > MAX_CENTS)
  ) {
    throw new Error('Invalid free shipping threshold.');
  }

  // Determine whether free shipping applies.
  const qualifiesForFreeShipping =
    freeShippingThresholdCents !== null &&
    subtotalCents >= freeShippingThresholdCents;

  const shippingCents = qualifiesForFreeShipping ? 0 : standardShippingCents;

  const totalBeforeTaxCents = subtotalCents + shippingCents;

  if (totalBeforeTaxCents > MAX_CENTS) {
    throw new Error('Checkout total is too large.');
  }

  return {
    subtotalCents,
    shippingCents,
    totalBeforeTaxCents,

    // Tax has not been calculated yet.
    taxCents: null,

    // We cannot finalize the total without tax.
    totalCents: null,
  };
}
