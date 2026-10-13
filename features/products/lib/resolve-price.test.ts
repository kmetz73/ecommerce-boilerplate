import { describe, expect, it } from 'vitest';

import { resolveVariantPricing } from './resolve-price';

describe('resolveVariantPricing', () => {
  const product = {
    priceCents: 4999,
    salePriceCents: 3999,
  };

  it('inherits product pricing without overrides', () => {
    expect(
      resolveVariantPricing(product, {
        priceCents: null,
        salePriceCents: null,
      })
    ).toEqual({
      priceCents: 4999,
      salePriceCents: 3999,
    });
  });

  it('ignores legacy regular price overrides', () => {
    expect(
      resolveVariantPricing(product, {
        priceCents: 5999,
        salePriceCents: null,
      })
    ).toEqual({
      priceCents: 4999,
      salePriceCents: 3999,
    });
  });

  it('ignores legacy regular and sale overrides', () => {
    expect(
      resolveVariantPricing(product, {
        priceCents: 5999,
        salePriceCents: 4499,
      })
    ).toEqual({
      priceCents: 4999,
      salePriceCents: 3999,
    });
  });

  it('ignores legacy sale overrides', () => {
    expect(
      resolveVariantPricing(product, {
        priceCents: null,
        salePriceCents: 3499,
      })
    ).toEqual({
      priceCents: 4999,
      salePriceCents: 3999,
    });
  });

  it('supports products without sales', () => {
    expect(
      resolveVariantPricing(
        { priceCents: 2999, salePriceCents: null },
        { priceCents: null, salePriceCents: null }
      )
    ).toEqual({
      priceCents: 2999,
      salePriceCents: null,
    });
  });
});
