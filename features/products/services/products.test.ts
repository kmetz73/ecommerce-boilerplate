import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createProduct,
  deleteProduct,
  getCatalogForViewer,
  getPublicCatalogProductBySlug,
  updateProduct,
} from './products';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  slugLookup: vi.fn(),
}));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentDbUser: mocks.user }));
vi.mock('@/features/products/data/products', () => ({
  createCatalogProduct: mocks.create,
  updateCatalogProduct: mocks.update,
  deleteCatalogProduct: mocks.remove,
  getCatalogProducts: mocks.list,
  getCatalogProductBySlug: mocks.slugLookup,
}));
const input = {
  name: 'Catalog product',
  description: 'Known facts',
  priceCents: 1999,
};

beforeEach(() => {
  vi.resetAllMocks();

  mocks.list.mockResolvedValue([]);
  mocks.slugLookup.mockResolvedValue(null);
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.remove.mockResolvedValue({ count: 1 });
});

describe('shared catalog policy', () => {
  it('allows public slug lookup without requiring an identity', async () => {
    mocks.slugLookup.mockResolvedValue({ uuid: '550e8400-e29b-41d4-a716-446655440000', slug: 'catalog-product' });
    await expect(getPublicCatalogProductBySlug('catalog-product')).resolves.toMatchObject({ slug: 'catalog-product' });
    expect(mocks.user).not.toHaveBeenCalled();
  });
  for (const identity of [null, { id: 42, role: 'USER' }]) {
    it(
      'rejects every mutation for ' +
        (identity
          ? 'a regular user, including the creator'
          : 'a signed-out caller'),
      async () => {
        mocks.user.mockResolvedValue(identity);

        await expect(createProduct(input)).rejects.toThrow('Unauthorized');
        await expect(
          updateProduct({
            ...input,
            productUuid: '550e8400-e29b-41d4-a716-446655440000',
          })
        ).rejects.toThrow('Unauthorized');
        await expect(
          deleteProduct({ productUuid: '550e8400-e29b-41d4-a716-446655440000' })
        ).rejects.toThrow('Unauthorized');

        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
        expect(mocks.remove).not.toHaveBeenCalled();
      }
    );
  }

  it('records the authenticated admin as creator and allows global edit/delete', async () => {
    mocks.user.mockResolvedValue({ id: 10, role: 'ADMIN' });

    await createProduct(input);

    expect(mocks.create).toHaveBeenCalledWith({
      ...input,
      slug: 'catalog-product',
      createdById: 10,
    });

    const productUuid = '550e8400-e29b-41d4-a716-446655440000';

    await deleteProduct({ productUuid });

    expect(mocks.remove).toHaveBeenCalledWith(productUuid);
  });

  it('adds a numeric suffix when a product slug already exists', async () => {
    mocks.user.mockResolvedValue({
      id: 10,
      role: 'ADMIN',
    });

    mocks.slugLookup
      .mockResolvedValueOnce({ uuid: '550e8400-e29b-41d4-a716-446655440000' })
      .mockResolvedValueOnce(null);

    await createProduct(input);

    expect(mocks.slugLookup).toHaveBeenNthCalledWith(1, 'catalog-product');
    expect(mocks.slugLookup).toHaveBeenNthCalledWith(2, 'catalog-product-2');

    expect(mocks.create).toHaveBeenCalledWith({
      ...input,
      slug: 'catalog-product-2',
      createdById: 10,
    });
  });

  it('returns a not-found result instead of claiming a missing product was updated', async () => {
    mocks.user.mockResolvedValue({ id: 10, role: 'ADMIN' });
    const productUuid = '550e8400-e29b-41d4-a716-446655440000';

    mocks.update.mockResolvedValue({ count: 0 });
    await expect(updateProduct({ ...input, productUuid })).resolves.toEqual({
      success: false,
      message: 'Product not found.',
    });
  });

  it('reports missing deletions and propagates database failures', async () => {
    mocks.user.mockResolvedValue({ id: 10, role: 'ADMIN' });
    const productUuid = '550e8400-e29b-41d4-a716-446655440000';

    mocks.remove.mockResolvedValue({ count: 0 });
    await expect(deleteProduct({ productUuid })).rejects.toThrow(
      'Product not found.'
    );

    mocks.update.mockRejectedValue(new Error('Database unavailable'));
    await expect(updateProduct({ ...input, productUuid })).rejects.toThrow(
      'Database unavailable'
    );
  });

  it('gives a regular user the entire shared catalog without management controls', async () => {
    mocks.user.mockResolvedValue({ id: 42, role: 'USER' });
    const product = { uuid: '550e8400-e29b-41d4-a716-446655440000', ownerId: 10, active: false };

    mocks.list.mockResolvedValue([product]);

    await expect(getCatalogForViewer()).resolves.toEqual({
      products: [product],
      canManage: false,
    });
    expect(mocks.list).toHaveBeenCalledWith({});
  });

  it('gives admins the same shared catalog with management controls', async () => {
    mocks.user.mockResolvedValue({ id: 10, role: 'ADMIN' });

    await expect(getCatalogForViewer()).resolves.toMatchObject({
      canManage: true,
    });
    expect(mocks.list).toHaveBeenCalledWith({});
  });

  it('allows signed-out visitors to browse the catalog without management controls', async () => {
    mocks.user.mockResolvedValue(null);

    const product = {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      ownerId: 10,
      active: true,
    };

    mocks.list.mockResolvedValue([product]);

    await expect(getCatalogForViewer()).resolves.toEqual({
      products: [product],
      canManage: false,
    });

    expect(mocks.list).toHaveBeenCalledWith({});
  });
});
