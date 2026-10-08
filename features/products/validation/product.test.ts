import { describe, expect, it } from 'vitest';

import {
  catalogProductLookupSchema,
  parseProductFormData,
  productSchema,
} from './product';

describe('productSchema', () => {
  it('rejects missing, blank, fractional, and overflowing form prices', () => {
    for (const price of [null, '', ' ', '1.5', '2147483648']) {
      const form = new FormData();
      form.set('name', 'Product');
      if (price !== null) form.set('priceCents', price);
      expect(() => parseProductFormData(form)).toThrow('Invalid product data');
    }
  });
  it('accepts a valid product', () => {
    const result = productSchema.safeParse({
      name: 'Storm Phaze II',
      description: 'Reactive bowling ball',
      priceCents: 15999,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a product with an empty name', () => {
    const result = productSchema.safeParse({
      name: '',
      description: 'Missing product name',
      priceCents: 15999,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = productSchema.safeParse({
      name: 'Storm Phaze II',
      description: 'Reactive bowling ball',
      priceCents: -100,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.priceCents).toBeDefined();
    }
  });

  it('parses valid product form data', () => {
    const formData = new FormData();

    formData.set('name', 'Storm Phaze II');
    formData.set('description', 'Reactive bowling ball');
    formData.set('priceCents', '15999');

    const result = parseProductFormData(formData);

    expect(result).toEqual({
      name: 'Storm Phaze II',
      description: 'Reactive bowling ball',
      priceCents: 15999,
    });
  });

  it('throws when product form data is invalid', () => {
    const formData = new FormData();

    formData.set('name', '');
    formData.set('description', 'Invalid product');
    formData.set('priceCents', '15999');

    expect(() => parseProductFormData(formData)).toThrow(
      'Invalid product data'
    );
  });
});

describe('catalogProductLookupSchema', () => {
  it('accepts a valid product UUID', () => {
    const result = catalogProductLookupSchema.safeParse({
      productUuid: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid or unexpected lookup arguments', () => {
    expect(catalogProductLookupSchema.safeParse({ productUuid: 7 }).success).toBe(false);
    expect(catalogProductLookupSchema.safeParse({}).success).toBe(false);
    expect(
      catalogProductLookupSchema.safeParse({
        productUuid: 'invalid',
      }).success
    ).toBe(false);

    expect(
      catalogProductLookupSchema.safeParse({
        productUuid: 7,
      }).success
    ).toBe(false);

    expect(
      catalogProductLookupSchema.safeParse({
        productUuid: '550e8400-e29b-41d4-a716-446655440000',
        role: 'ADMIN',
      }).success
    ).toBe(false);
  });
});
