import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addProductImageToCatalog } from './product-images';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  productLookup: vi.fn(),
  getImages: vi.fn(),
  createImage: vi.fn(),
  upload: vi.fn(),
  deleteStored: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock('@/features/products/data/products', () => ({
  getCatalogProductByUuid: mocks.productLookup,
}));

vi.mock('@/features/products/data/product-images', () => ({
  getProductImages: mocks.getImages,
  createProductImage: mocks.createImage,
}));

vi.mock('@/lib/storage/product-images', () => ({
  uploadProductImage: mocks.upload,
  deleteStoredProductImage: mocks.deleteStored,
}));

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const objectKey = `products/${productUuid}/test.webp`;

const createInput = () => ({
  productUuid,
  altText: 'Front view of the product',
  file: new File(['test'], 'test.webp', {
    type: 'image/webp',
  }),
});

beforeEach(() => {
  vi.resetAllMocks();

  mocks.requireAdmin.mockResolvedValue({
    id: 1,
    role: 'ADMIN',
  });

  mocks.productLookup.mockResolvedValue({ uuid: productUuid });
  mocks.getImages.mockResolvedValue([]);
  mocks.upload.mockResolvedValue({ key: objectKey });
  mocks.createImage.mockResolvedValue({
    id: 'image-id',
    productUuid,
    objectKey,
    sortOrder: 0,
  });
});

describe('Product image service', () => {
  it('rejects unauthorized uploads', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('Unauthorized'));

    await expect(addProductImageToCatalog(createInput())).rejects.toThrow(
      'Unauthorized'
    );

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.createImage).not.toHaveBeenCalled();
  });

  it('rejects images for missing products', async () => {
    mocks.productLookup.mockResolvedValue(null);

    await expect(addProductImageToCatalog(createInput())).rejects.toThrow(
      'Product not found'
    );

    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('uploads and saves the image reference', async () => {
    const result = await addProductImageToCatalog(createInput());

    expect(mocks.upload).toHaveBeenCalledWith(productUuid, expect.any(File));

    expect(mocks.createImage).toHaveBeenCalledWith({
      productUuid,
      objectKey,
      altText: 'Front view of the product',
      sortOrder: 0,
    });

    expect(result.objectKey).toBe(objectKey);
  });

  it('assigns the next image position', async () => {
    mocks.getImages.mockResolvedValue([{ sortOrder: 0 }, { sortOrder: 2 }]);

    await addProductImageToCatalog(createInput());

    expect(mocks.createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        sortOrder: 3,
      })
    );
  });

  it('deletes the MinIO object if PostgreSQL fails', async () => {
    mocks.createImage.mockRejectedValue(new Error('Database unavailable'));

    await expect(addProductImageToCatalog(createInput())).rejects.toThrow(
      'Database unavailable'
    );

    expect(mocks.deleteStored).toHaveBeenCalledWith(objectKey);
  });
});
