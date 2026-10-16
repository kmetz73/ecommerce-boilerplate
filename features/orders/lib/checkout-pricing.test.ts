import { describe, expect, it } from 'vitest';

import {
  calculateCheckoutEstimate,
  type ShippingPolicy,
} from './checkout-pricing';

// Example rates for testing only.
const policy: ShippingPolicy = {
  standardShippingCents: 599,
  freeShippingThresholdCents: 5000,
};

describe('checkout pricing', () => {
  it('calculates standard shipping', () => {
    const result = calculateCheckoutEstimate(4599, 'US', policy);

    expect(result.subtotalCents).toBe(4599);
    expect(result.shippingCents).toBe(599);
    expect(result.totalBeforeTaxCents).toBe(5198);
  });

  it('provides free shipping at the threshold', () => {
    const result = calculateCheckoutEstimate(5000, 'US', policy);

    expect(result.shippingCents).toBe(0);
    expect(result.totalBeforeTaxCents).toBe(5000);
  });

  it('supports a store without free shipping', () => {
    const result = calculateCheckoutEstimate(10000, 'US', {
      standardShippingCents: 599,
      freeShippingThresholdCents: null,
    });

    expect(result.shippingCents).toBe(599);
  });

  it('rejects unsupported destinations', () => {
    expect(() => calculateCheckoutEstimate(4599, 'CA', policy)).toThrow(
      'Shipping destination is not supported.'
    );
  });

  it('rejects invalid shipping rates', () => {
    expect(() =>
      calculateCheckoutEstimate(4599, 'US', {
        standardShippingCents: -100,
        freeShippingThresholdCents: null,
      })
    ).toThrow('Invalid shipping rate.');
  });

  
it('rejects invalid totals', () => {
  expect(() =>
    calculateCheckoutEstimate(2_147_483_647, 'US', {
      standardShippingCents: 599,
      freeShippingThresholdCents: null,
    })
  ).toThrow('Checkout total is too large.');
});


  it('does not pretend uncalculated tax is zero', () => {
    const result = calculateCheckoutEstimate(4599, 'US', policy);

    expect(result.taxCents).toBeNull();
    expect(result.totalCents).toBeNull();
  });
});
