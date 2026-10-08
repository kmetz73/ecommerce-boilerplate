import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProduct, deleteProduct, updateProduct } from './products';
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/lib/auth/require-admin', () => ({ requireAdmin: mocks.guard }));
vi.mock('@/features/products/services/products', () => ({
  createProduct: mocks.create,
  updateProduct: mocks.update,
  deleteProduct: mocks.remove,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
beforeEach(() => vi.resetAllMocks());

describe('product Server Action boundary', () => {
  it('rejects direct calls to all mutations before parsing data or invoking services', async () => {
    mocks.guard.mockRejectedValue(new Error('Unauthorized'));
    const form = new FormData();
    await expect(createProduct(form)).rejects.toThrow('Unauthorized');
    await expect(updateProduct(null, form)).rejects.toThrow('Unauthorized');
    await expect(deleteProduct(form)).rejects.toThrow('Unauthorized');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('ignores forged creator fields and refreshes catalog, storefront, and detail views after create', async () => {
    mocks.guard.mockResolvedValue({ id: 10, role: 'ADMIN' });
    const form = new FormData();
    form.set('name', 'Shared product');
    form.set('description', 'Facts');
    form.set('priceCents', '100');
    form.set('ownerId', '999');
    form.set('createdById', '999');
    await createProduct(form);
    expect(mocks.create).toHaveBeenCalledWith({
      name: 'Shared product',
      description: 'Facts',
      priceCents: 100,
    });
    expect(mocks.refresh).toHaveBeenCalledWith('/products');
    expect(mocks.refresh).toHaveBeenCalledWith('/admin');
    expect(mocks.redirect).toHaveBeenCalledWith('/products');
  });

  it('rejects malformed mutation identifiers even for an admin', async () => {
    for (const id of ['', '0', '-1', '1.5', 'NaN']) {
      const form = new FormData();
      form.set('productUuid', id);
      await expect(deleteProduct(form)).rejects.toThrow('Invalid product UUID');
    }
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
