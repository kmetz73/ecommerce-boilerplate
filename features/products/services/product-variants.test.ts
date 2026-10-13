import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProductVariant, updateProductVariant } from './product-variants';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getVariantProduct: vi.fn(),
  getProductVariantBySku: vi.fn(),
  getProductVariants: vi.fn(),
  createCatalogProductVariant: vi.fn(),
  updateCatalogProductVariant: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock('@/features/products/data/product-variants', () => ({
  getVariantProduct: mocks.getVariantProduct,
  getProductVariantBySku: mocks.getProductVariantBySku,
  getProductVariants: mocks.getProductVariants,
  createCatalogProductVariant: mocks.createCatalogProductVariant,
  updateCatalogProductVariant: mocks.updateCatalogProductVariant,
}));

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const variantUuid = '550e8400-e29b-41d4-a716-446655440001';

beforeEach(() => {
  vi.resetAllMocks();

  mocks.requireAdmin.mockResolvedValue({ id: 1, role: 'ADMIN' });

  mocks.getVariantProduct.mockResolvedValue({
    uuid: productUuid,
    priceCents: 5000,
    salePriceCents: 4000,
  });

  mocks.getProductVariantBySku.mockResolvedValue(null);
  mocks.getProductVariants.mockResolvedValue([]);
});

const input = { productUuid, sku: 'TEST-001', optionValues: { Color: 'Black' }, stockQuantity: 5, active: true };

describe('variants inherit parent pricing', () => {
  it('strips submitted legacy pricing before creation', async () => {
    await createProductVariant({ ...input, ...{ priceCents: 6000, salePriceCents: 7000 } });
    expect(mocks.createCatalogProductVariant).toHaveBeenCalledWith(input);
  });
  it('updates inventory even when legacy override prices are invalid', async () => {
    mocks.getProductVariants.mockResolvedValue([{ uuid: variantUuid, priceCents: 4000, salePriceCents: 6000 }]);
    const update = { productUuid, variantUuid, stockQuantity: 10, active: false };
    await updateProductVariant({ ...update, ...{ priceCents: 100, salePriceCents: 200 } });
    expect(mocks.updateCatalogProductVariant).toHaveBeenCalledWith(update);
  });
  it('preserves administrator permissions', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('Unauthorized'));
    await expect(createProductVariant(input)).rejects.toThrow('Unauthorized');
    await expect(updateProductVariant({ productUuid, variantUuid, stockQuantity: 1, active: true })).rejects.toThrow('Unauthorized');
    expect(mocks.createCatalogProductVariant).not.toHaveBeenCalled();
    expect(mocks.updateCatalogProductVariant).not.toHaveBeenCalled();
  });
  it('still rejects duplicate SKUs and option combinations', async () => {
    mocks.getProductVariantBySku.mockResolvedValue({ uuid: variantUuid });
    await expect(createProductVariant(input)).rejects.toThrow('This SKU is already in use.');
    mocks.getProductVariantBySku.mockResolvedValue(null);
    mocks.getProductVariants.mockResolvedValue([{ optionValues: { color: 'black' } }]);
    await expect(createProductVariant(input)).rejects.toThrow('A variant with these options already exists.');
  });
  it('still verifies parent existence and variant membership', async () => {
    mocks.getVariantProduct.mockResolvedValue(null);
    await expect(createProductVariant(input)).rejects.toThrow('Product not found.');
    await expect(updateProductVariant({ productUuid, variantUuid, stockQuantity: 1, active: true })).rejects.toThrow('Variant not found for this product.');
  });
});
