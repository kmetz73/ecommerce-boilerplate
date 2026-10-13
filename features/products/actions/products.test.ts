import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProduct, deleteProduct, updateProduct } from './products';
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
  redirect: vi.fn(),
  image: vi.fn(),
}));
vi.mock('@/lib/auth/require-admin', () => ({ requireAdmin: mocks.guard }));

vi.mock('@/features/products/services/products', () => ({
  createProduct: mocks.create,
  updateProduct: mocks.update,
  deleteProduct: mocks.remove,
}));

// Mock product image uploads to prevent real database initialization.
vi.mock('@/features/products/services/product-images', () => ({
  addProductImageToCatalog: mocks.image,
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
beforeEach(() => vi.resetAllMocks());

describe('product Server Action boundary', () => {
  it('rejects direct calls to all mutations before parsing data or invoking services', async () => {
    mocks.guard.mockRejectedValue(new Error('Unauthorized'));
    const form = new FormData();
    await expect(createProduct(null, form)).rejects.toThrow('Unauthorized');
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
    form.set('priceDollars', '1.00');
    form.set('ownerId', '999');
    form.set('createdById', '999');
    await createProduct(null, form);
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

describe('product price form feedback', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  function form(price: string, sale?: string) {
    const data = new FormData();
    data.set('productUuid', uuid);
    data.set('name', 'Product');
    data.set('priceDollars', price);
    if (sale !== undefined) data.set('salePriceDollars', sale);
    return data;
  }
  it.each(['', '-1', 'abc', '3.999', '21474836.48', '1e2'])('returns useful create and edit feedback for invalid price %s', async (price) => {
    const create = await createProduct(null, form(price));
    const update = await updateProduct(null, form(price));
    expect(create).toEqual({ success: false, message: expect.any(String) });
    expect(update).toEqual(create);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it.each(['-1', 'oops', '3.999', '399', '400'])('returns sale validation feedback for %s', async (sale) => {
    const result = await updateProduct(null, form('399', sale));
    expect(result).toEqual({ success: false, message: expect.any(String) });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('creates at whole dollar pricing and ignores forged sale fields', async () => {
    mocks.create.mockResolvedValue({ uuid, slug: 'product', name: 'Product' });
    await createProduct(null, form('399', '3.99'));
    expect(mocks.create).toHaveBeenCalledWith({ name: 'Product', priceCents: 39900 });
  });
  it.each([['3.99', 399], ['', null], ['0', 0]])('saves or clears an optional sale %s', async (sale, expected) => {
    mocks.update.mockResolvedValue({ success: true });
    await updateProduct(null, form('399', sale));
    expect(mocks.update).toHaveBeenCalledWith({ productUuid: uuid, name: 'Product', priceCents: 39900, salePriceCents: expected });
    expect(mocks.refresh).toHaveBeenCalledWith('/shop');
    expect(mocks.refresh).toHaveBeenCalledWith('/products', 'layout');
  });
});

describe('primary image creation remains supported', () => {
  function imageForm(type: string) {
    const form = new FormData();
    form.set('name', 'Product');
    form.set('description', 'Description');
    form.set('priceDollars', '3.99');
    form.set('image', new File(['image'], 'photo.png', { type }));
    return form;
  }
  it('creates the product then uploads its primary image', async () => {
    mocks.create.mockResolvedValue({ uuid: 'product-uuid', slug: 'product', name: 'Product' });
    await createProduct(null, imageForm('image/png'));
    expect(mocks.create).toHaveBeenCalledWith({ name: 'Product', description: 'Description', priceCents: 399 });
    expect(mocks.image).toHaveBeenCalledWith({ productUuid: 'product-uuid', altText: 'Product product photo', file: expect.any(File) });
    expect(mocks.redirect).toHaveBeenCalledWith('/products');
  });
  it('returns feedback for unsupported files before creating a product', async () => {
    expect(await createProduct(null, imageForm('text/plain'))).toEqual({ success: false, message: 'Image must be JPG, PNG, or WebP and 5 MB or smaller.' });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.image).not.toHaveBeenCalled();
  });
  it('preserves the recovery redirect when the initial image upload fails', async () => {
    mocks.create.mockResolvedValue({ uuid: 'product-uuid', slug: 'product', name: 'Product' });
    mocks.image.mockRejectedValue(new Error('Upload failed'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await createProduct(null, imageForm('image/png'));
      expect(mocks.redirect).toHaveBeenCalledWith('/products/product/edit?imageUpload=failed');
    } finally { log.mockRestore(); }
  });
});
