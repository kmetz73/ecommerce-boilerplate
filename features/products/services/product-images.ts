import { revalidatePath } from 'next/cache';
import { z } from 'zod';


import { requireAdmin } from '@/lib/auth/require-admin';
import {
  uploadProductImage,
  deleteStoredProductImage,
} from '@/lib/storage/product-images';

import { getCatalogProductByUuid } from '@/features/products/data/products';

import {
  createProductImage,
  getProductImages,
  setPrimaryProductImageOrder,
  deleteProductImageRecord,
} from '@/features/products/data/product-images';

const imageMetadataSchema = z.object({
  productUuid: z.string().uuid(),
  altText: z.string().trim().min(3).max(200),
});

type AddProductImageInput = {
  productUuid: string;
  altText: string;
  file: File;
};

export async function addProductImageToCatalog(input: AddProductImageInput) {
  // 1. Only administrators can upload product images.
  await requireAdmin();

  // 2. Validate the image metadata.
  const { productUuid, altText } = imageMetadataSchema.parse({
    productUuid: input.productUuid,
    altText: input.altText,
  });

  if (!(input.file instanceof File)) {
    throw new Error('A valid image file is required.');
  }

  // 3. Confirm the product exists.
  const product = await getCatalogProductByUuid(productUuid);

  if (!product) {
    throw new Error('Product not found.');
  }

  // 4. Determine the next gallery position.
  const existingImages = await getProductImages(productUuid);

  const sortOrder =
    existingImages.reduce(
      (highest, image) => Math.max(highest, image.sortOrder),
      -1
    ) + 1;

  // 5. Upload the image to MinIO.
  const { key } = await uploadProductImage(productUuid, input.file);

  try {
    // 6. Register the image in PostgreSQL.
    return await createProductImage({
      productUuid,
      objectKey: key,
      altText,
      sortOrder,
    });
  } catch (error) {
    // 7. Roll back the MinIO upload if the database fails.
    try {
      await deleteStoredProductImage(key);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded product image:', cleanupError);
    }

    throw error;
  }
}
const primaryImageSchema = z.object({
  productUuid: z.string().uuid(),
  imageId: z.string().uuid(),
});

export async function setPrimaryProductImage(input: {
  productUuid: string;
  imageId: string;
}) {
  await requireAdmin();

  const { productUuid, imageId } = primaryImageSchema.parse(input);

  const product = await getCatalogProductByUuid(productUuid);

  if (!product) {
    throw new Error('Product not found.');
  }

  const updated = await setPrimaryProductImageOrder(productUuid, imageId);

  if (!updated) {
    throw new Error('Image not found for this product.');
  }

  return {
    slug: product.slug,
  };
}
const deleteImageSchema = z.object({
  productUuid: z.string().uuid(),
  imageId: z.string().uuid(),
});

export async function deleteProductImage(input: {
  productUuid: string;
  imageId: string;
}) {
  // Only administrators can delete product images.
  await requireAdmin();

  const { productUuid, imageId } = deleteImageSchema.parse(input);

  // Verify that the product exists.
  const product = await getCatalogProductByUuid(productUuid);

  if (!product) {
    throw new Error('Product not found.');
  }

  // Remove the image reference from PostgreSQL.
  const deletedImage = await deleteProductImageRecord(productUuid, imageId);

  if (!deletedImage) {
    throw new Error('Image not found for this product.');
  }

  // Remove the actual file from MinIO.
  let storageCleanupFailed = false;

  try {
    await deleteStoredProductImage(deletedImage.objectKey);
  } catch (error) {
    storageCleanupFailed = true;

    console.error('Product image storage cleanup failed:', {
      imageId,
      objectKey: deletedImage.objectKey,
      error,
    });
  }

  return {
    slug: product.slug,
    storageCleanupFailed,
  };
}
