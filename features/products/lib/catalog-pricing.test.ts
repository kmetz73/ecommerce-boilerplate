import { describe, expect, it } from 'vitest';

import { getCatalogPricing } from './catalog-pricing';

describe('getCatalogPricing', () => {
  const product = {
    priceCents: 599,
    salePriceCents: 499,
    active: true,
  };

  it('uses product pricing when no variants exist', () => {
    expect(getCatalogPricing(product, [])).toEqual({
      priceCents: 599,
      salePriceCents: 499,
      displayPriceCents: 499,
      isAvailable: true,
      showFrom: false,
    });
  });

  it('ignores differing legacy prices without showing From', () => {
    const result = getCatalogPricing(product, [
      {
        priceCents: null,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 10,
        active: true,
      },
      {
        priceCents: 699,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 5,
        active: true,
      },
      {
        priceCents: 399,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 0,
        active: true,
      },
    ]);

    expect(result.displayPriceCents).toBe(499);
    expect(result.showFrom).toBe(false);
    expect(result.isAvailable).toBe(true);
  });

  it('uses the parent sale despite a legacy variant sale', () => {
    const result = getCatalogPricing(product, [
      {
        priceCents: 899,
        salePriceCents: 699,
        optionValues: { Size: 'M' },
        stockQuantity: 5,
        active: true,
      },
    ]);

    expect(result.priceCents).toBe(599);
    expect(result.salePriceCents).toBe(499);
  });

  it('marks products sold out when all variants have zero stock', () => {
    const result = getCatalogPricing(product, [
      {
        priceCents: null,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 0,
        active: true,
      },
    ]);

    expect(result.isAvailable).toBe(false);
    expect(result.displayPriceCents).toBe(499);
  });

  it('retains parent pricing regardless of inactive overrides', () => {
    const result = getCatalogPricing(product, [
      {
        priceCents: 199,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 10,
        active: false,
      },
      {
        priceCents: 799,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 4,
        active: true,
      },
    ]);

    expect(result.displayPriceCents).toBe(499);
  });

  it('does not show From when all eligible prices match', () => {
    const result = getCatalogPricing(product, [
      {
        priceCents: null,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 3,
        active: true,
      },
      {
        priceCents: null,
        salePriceCents: null,
        optionValues: { Size: 'M' },
        stockQuantity: 5,
        active: true,
      },
    ]);

    expect(result.showFrom).toBe(false);
  });
});

it('treats inactive products and invalid or inactive options as unavailable', () => {
  const product = { priceCents: 39900, salePriceCents: null, active: true };
  const variant = { stockQuantity: 5, active: true, optionValues: { Size: 'M' } };
  expect(getCatalogPricing({ ...product, active: false }, [variant]).isAvailable).toBe(false);
  expect(getCatalogPricing(product, [{ ...variant, active: false }]).isAvailable).toBe(false);
  expect(getCatalogPricing(product, [{ ...variant, optionValues: {} }]).isAvailable).toBe(false);
});

it('ignores legacy sales when the product has no sale and falls back from invalid parent sales', () => {
  const variant = { stockQuantity: 5, active: true, optionValues: { Size: 'M' }, priceCents: 999, salePriceCents: 1 };
  for (const salePriceCents of [null, -1, 39900, 40000]) {
    expect(getCatalogPricing({ priceCents: 39900, salePriceCents, active: true }, [variant]).displayPriceCents).toBe(39900);
  }
});


it('respects finite inventory for nonvariant products', () => {
  const product = {
    priceCents: 1999,
    salePriceCents: null,
    active: true,
  };

  expect(
    getCatalogPricing({ ...product, stockQuantity: 0 }, []).isAvailable
  ).toBe(false);

  expect(
    getCatalogPricing({ ...product, stockQuantity: 5 }, []).isAvailable
  ).toBe(true);

  expect(
    getCatalogPricing({ ...product, stockQuantity: null }, []).isAvailable
  ).toBe(true);
});

