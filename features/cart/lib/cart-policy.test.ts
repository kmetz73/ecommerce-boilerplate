import { describe, expect, it } from 'vitest';

import {
  getSelectionKey,
  validateCartSelection,
  type CartProduct,
} from './cart-policy';

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const variantUuid = '550e8400-e29b-41d4-a716-446655440001';

const baseProduct: CartProduct = {
  uuid: productUuid,
  active: true,
  stockQuantity: 10,
  variants: [],
};


describe('cart product selection', () => {
  it('accepts an available product without variants', () => {
    expect(validateCartSelection(baseProduct, null, 2)).toEqual({
      success: true,
    });
  });

  it('rejects zero-stock products even when active', () => {
    const product: CartProduct = {
      ...baseProduct,
      active: true,
      stockQuantity: 0,
      variants: [],
    };

    const result = validateCartSelection(product, null, 1);

    expect(result.success).toBe(false);
  });

  it('rejects quantities exceeding inventory', () => {
    expect(validateCartSelection(baseProduct, null, 11).success).toBe(false);
  });

  it('requires variant selection when variants exist', () => {
    const product: CartProduct = {
      ...baseProduct,
      variants: [
        {
          uuid: variantUuid,
          productUuid,
          active: true,
          stockQuantity: 5,
          optionValues: { Size: 'Large' },
        },
      ],
    };

    expect(validateCartSelection(product, null, 1).success).toBe(false);

    expect(validateCartSelection(product, variantUuid, 3)).toEqual({
      success: true,
    });

    expect(validateCartSelection(product, variantUuid, 6).success).toBe(false);
  });

  it('rejects variants belonging to another product', () => {
    const product: CartProduct = {
      ...baseProduct,
      variants: [
        {
          uuid: variantUuid,
          productUuid: '550e8400-e29b-41d4-a716-446655440099',
          active: true,
          stockQuantity: 5,
          optionValues: { Size: 'Large' },
        },
      ],
    };

    expect(validateCartSelection(product, variantUuid, 1).success).toBe(false);
  });

  it('rejects invalid variant options', () => {
    const product: CartProduct = {
      ...baseProduct,
      variants: [
        {
          uuid: variantUuid,
          productUuid,
          active: true,
          stockQuantity: 5,
          optionValues: {},
        },
      ],
    };

    expect(validateCartSelection(product, variantUuid, 1).success).toBe(false);
  });

  it('creates distinct selection keys', () => {
    expect(getSelectionKey(productUuid, null)).not.toBe(
      getSelectionKey(productUuid, variantUuid)
    );
  });
});
