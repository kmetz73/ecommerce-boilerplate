import { describe, expect, it } from 'vitest';

import {
  catalogProductLookupSchema,
  parseProductFormData,
  ProductFormValidationError,
  productSchema,
} from './product';

describe('productSchema', () => {
  it('rejects missing, blank, overprecise, and overflowing dollar prices', () => {
    for (const price of [null, '', ' ', '1.555', '21474836.48']) {
      const form = new FormData();
      form.set('name', 'Product');
      if (price !== null) form.set('priceDollars', price);
      expect(() => parseProductFormData(form)).toThrow();
    }
  });
  // Lesson 26 — Inventory validation tests

  it('accepts zero stock when inventory tracking is enabled', () => {
    const form = new FormData();

    form.set('name', 'Test Product');
    form.set('priceDollars', '42.00');
    form.set('inventoryConfigured', 'true');
    form.set('trackInventory', 'on');
    form.set('stockQuantity', '0');

    const result = parseProductFormData(form);

    expect(result.stockQuantity).toBe(0);
  });

  it('clears inventory tracking when unchecked', () => {
    const form = new FormData();

    form.set('name', 'Test Product');
    form.set('priceDollars', '42.00');
    form.set('inventoryConfigured', 'true');
    form.set('stockQuantity', '10');

    const result = parseProductFormData(form);

    expect(result.stockQuantity).toBeNull();
  });

  it('rejects invalid stock quantities', () => {
    for (const value of ['-1', '1.5', '', 'abc', '2147483648']) {
      const form = new FormData();

      form.set('name', 'Test Product');
      form.set('priceDollars', '42.00');
      form.set('inventoryConfigured', 'true');
      form.set('trackInventory', 'on');
      form.set('stockQuantity', value);

      expect(() => parseProductFormData(form)).toThrow(
        ProductFormValidationError
      );
    }
  });
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
    formData.set('priceDollars', '159.99');

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
    formData.set('priceDollars', '159.99');

    expect(() => parseProductFormData(formData)).toThrow(
      'Product name is required'
    );
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
