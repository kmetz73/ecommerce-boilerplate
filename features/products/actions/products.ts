'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  parseProductFormData,
  ProductFormValidationError,
} from '@/features/products/validation/product';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  updateProduct as updateProductService,
} from '@/features/products/services/products';

import { addProductImageToCatalog } from '@/features/products/services/product-images';

export type ProductActionState = {
  success: false;
  message: string;
} | null;

function parseProductUuid(formData: FormData) {
  const productUuid = formData.get('productUuid');

  if (
    typeof productUuid !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      productUuid
    )
  ) {
    throw new Error('Invalid product UUID');
  }

  return productUuid;
}

function refreshCatalog() {
  revalidatePath('/products');
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/products', 'layout');
}

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();

  // Validate product information.
  let input;
  try {
    input = parseProductFormData(formData, false);
  } catch (error) {
    if (error instanceof ProductFormValidationError) {
      return { success: false, message: error.message };
    }
    throw error;
  }

  // The initial image is optional.
  const file = formData.get('image');
  const image = file instanceof File && file.size > 0 ? file : null;

  // Check the file before creating the product.
  if (
    image &&
    (image.size > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(image.type))
  ) {
    return {
      success: false,
      message: 'Image must be JPG, PNG, or WebP and 5 MB or smaller.',
    };
  }

  // Create the product and retrieve its UUID.
  const product = await createProductService(input);

  let imageUploadFailed = false;

  // Upload the first product image if one was provided.
  if (image) {
    try {
      await addProductImageToCatalog({
        productUuid: product.uuid,
        altText: `${product.name} product photo`,
        file: image,
      });
    } catch (error) {
      console.error('Initial product image upload failed:', error);
      imageUploadFailed = true;
    }
  }

  refreshCatalog();

  // Product was created, but the image failed.
  if (imageUploadFailed) {
    redirect(`/products/${product.slug}/edit?imageUpload=failed`);
  }

  redirect('/products');
}

export async function updateProduct(
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();
  const productUuid = parseProductUuid(formData);
  let input;
  try {
    input = parseProductFormData(formData);
  } catch (error) {
    if (error instanceof ProductFormValidationError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
  const result = await updateProductService({
    ...input,
    productUuid,
  });
  if (!result.success) return result;
  refreshCatalog();
  redirect('/products');
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  await deleteProductService({ productUuid: parseProductUuid(formData) });
  refreshCatalog();
}
