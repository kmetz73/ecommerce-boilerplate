import type { ShippingPolicy } from './checkout-pricing';

function parseCents(value: string | undefined, name: string): number {
  if (value === undefined || !/^\d+$/.test(value)) {
    throw new Error(`Configure ${name} correctly.`);
  }

  const cents = Number(value);

  if (!Number.isSafeInteger(cents) || cents > 2_147_483_647) {
    throw new Error(`Invalid ${name}.`);
  }

  return cents;
}

export function getShippingPolicy(): ShippingPolicy {
  const standardShippingCents = parseCents(
    process.env.CHECKOUT_STANDARD_SHIPPING_CENTS,
    'CHECKOUT_STANDARD_SHIPPING_CENTS'
  );

  const threshold = process.env.CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS;

  const freeShippingThresholdCents =
    threshold === undefined || threshold === ''
      ? null
      : parseCents(threshold, 'CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS');

  return {
    standardShippingCents,
    freeShippingThresholdCents,
  };
}
