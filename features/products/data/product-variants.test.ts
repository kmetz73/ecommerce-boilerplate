import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCatalogProductVariant,
  updateCatalogProductVariant,
} from './product-variants';

const db = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    productVariant: db,
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const variantUuid = '550e8400-e29b-41d4-a716-446655440001';

describe('variant pricing persistence is disabled', () => {
  it('creates only SKU, options, stock and active status', async () => {
    const input = { productUuid, sku: 'TEST-BLACK', optionValues: { Color: 'Black' }, stockQuantity: 10, active: true };
    await createCatalogProductVariant({ ...input, ...{ priceCents: 5000, salePriceCents: 3999 } });
    expect(db.create).toHaveBeenCalledWith({ data: input });
  });
  it('updates stock and status without writing legacy pricing', async () => {
    await updateCatalogProductVariant({ productUuid, variantUuid, stockQuantity: 7, active: false, ...{ priceCents: 5000, salePriceCents: 2999 } });
    expect(db.update).toHaveBeenCalledWith({ where: { productUuid, uuid: variantUuid }, data: { stockQuantity: 7, active: false } });
  });
});
