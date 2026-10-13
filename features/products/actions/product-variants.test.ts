import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProductVariantAction, updateProductVariantAction } from './product-variants';

const mocks = vi.hoisted(() => ({ guard: vi.fn(), create: vi.fn(), update: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/auth/require-admin', () => ({ requireAdmin: mocks.guard }));
vi.mock('@/features/products/services/product-variants', () => ({ createProductVariant: mocks.create, updateProductVariant: mocks.update, deleteProductVariant: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }));

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const variantUuid = '550e8400-e29b-41d4-a716-446655440001';
const idle = { status: 'idle' as const, message: '' };
function form(stock = '7') {
  const data = new FormData();
  data.set('productUuid', productUuid);
  data.set('variantUuid', variantUuid);
  data.set('sku', 'TEST-SKU');
  data.set('optionValues', JSON.stringify({ Size: 'M' }));
  data.set('stockQuantity', stock);
  data.set('active', 'on');
  // Forged obsolete fields must not affect inventory edits or pricing.
  data.set('priceDollars', 'invalid');
  data.set('salePriceDollars', '99999');
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.create.mockResolvedValue({ sku: 'TEST-SKU' });
  mocks.update.mockResolvedValue({ sku: 'TEST-SKU' });
});
describe('variant form pricing removal', () => {
  it('ignores legacy price inputs on create and edit and refreshes storefronts', async () => {
    expect((await createProductVariantAction(idle, form())).status).toBe('success');
    expect(mocks.create).toHaveBeenCalledWith({ productUuid, sku: 'TEST-SKU', optionValues: { Size: 'M' }, stockQuantity: 7, active: true });
    expect((await updateProductVariantAction(idle, form())).status).toBe('success');
    expect(mocks.update).toHaveBeenCalledWith({ productUuid, variantUuid, stockQuantity: 7, active: true });
    expect(mocks.refresh).toHaveBeenCalledWith('/products', 'layout');
    expect(mocks.refresh).toHaveBeenCalledWith('/shop');
  });
  it.each(['', '-1', '1.5', '2147483648'])('still rejects invalid stock %s with form feedback', async (stock) => {
    expect((await createProductVariantAction(idle, form(stock))).status).toBe('error');
    expect((await updateProductVariantAction(idle, form(stock))).status).toBe('error');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('retains Clerk permission guards before validation', async () => {
    mocks.guard.mockRejectedValue(new Error('Unauthorized'));
    await expect(createProductVariantAction(idle, form())).rejects.toThrow('Unauthorized');
    await expect(updateProductVariantAction(idle, form())).rejects.toThrow('Unauthorized');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
