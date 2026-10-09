'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  addProductImageToCatalog,
  setPrimaryProductImage,
  deleteProductImage,
} from '@/features/products/services/product-images';

export type ProductImageUploadState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const uploadFormSchema = z.object({
  productUuid: z.string().uuid(),
  altText: z.string().trim().min(3).max(200),
});

export async function uploadProductImageAction(
  _previousState: ProductImageUploadState,
  formData: FormData
): Promise<ProductImageUploadState> {
  // Verify authorization first.
  await requireAdmin();

  const parsed = uploadFormSchema.safeParse({
    productUuid: formData.get('productUuid'),
    altText: formData.get('altText'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid product or image description.',
    };
  }

  const file = formData.get('image');

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: 'error',
      message: 'Please select an image.',
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      status: 'error',
      message: 'Image must be 5 MB or smaller.',
    };
  }

  try {
    await addProductImageToCatalog({
      productUuid: parsed.data.productUuid,
      altText: parsed.data.altText,
      file,
    });

    revalidatePath('/products', 'layout');
    revalidatePath('/shop');
    revalidatePath('/');

    return {
      status: 'success',
      message: 'Product image uploaded successfully!',
    };
  } catch (error) {
    const isImageFormatError =
      error instanceof Error &&
      error.message.startsWith('Invalid image format.');

    // Log unexpected errors, not normal image validation failures.
    if (!isImageFormatError) {
      console.error('Product image upload failed:', error);
    }

    return {
      status: 'error',
      message: isImageFormatError
        ? error.message
        : 'Unable to upload image. Please try again.',
    };
  }
}

// Look up one registered product image by its UUID.
export async function getProductImageById(imageId: string) {
  return prisma.productImage.findUnique({
    where: {
      id: imageId,
    },
    select: {
      id: true,
      objectKey: true,
    },
  });
}

export async function setPrimaryProductImageAction(formData: FormData) {
  await requireAdmin();

  const parsed = z
    .object({
      productUuid: z.string().uuid(),
      imageId: z.string().uuid(),
    })
    .safeParse({
      productUuid: formData.get('productUuid'),
      imageId: formData.get('imageId'),
    });

  if (!parsed.success) {
    throw new Error('Invalid product image selection.');
  }

  const { slug } = await setPrimaryProductImage(parsed.data);

  // Refresh the gallery and image-management page.
  revalidatePath(`/products/${slug}`);
  revalidatePath(`/products/${slug}/edit`);

  // Refresh all catalog cards using the primary image.
  revalidatePath('/products');
  revalidatePath('/shop');
  revalidatePath('/');
}
export async function deleteProductImageAction(
  formData: FormData
): Promise<void> {
  // Only administrators can delete images.
  await requireAdmin();

  // Validate the submitted identifiers.
  const parsed = z
    .object({
      productUuid: z.string().uuid(),
      imageId: z.string().uuid(),
    })
    .safeParse({
      productUuid: formData.get('productUuid'),
      imageId: formData.get('imageId'),
    });

  if (!parsed.success) {
    throw new Error('Invalid product image selection.');
  }

  // Delete the image record and attempt MinIO cleanup.
  const { slug, storageCleanupFailed } = await deleteProductImage(parsed.data);

  // Refresh product details and image management.
  revalidatePath(`/products/${slug}`);
  revalidatePath(`/products/${slug}/edit`);

  // Refresh product cards throughout the storefront.
  revalidatePath('/products');
  revalidatePath('/shop');
  revalidatePath('/');

  if (storageCleanupFailed) {
    console.warn(
      'Image removed from catalog, but MinIO cleanup needs attention.'
    );
  }
}
