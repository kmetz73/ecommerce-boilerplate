'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import { parseProductFormData } from '@/features/products/validation/product';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  updateProduct as updateProductService,
} from '@/features/products/services/products';

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



export async function createProduct(formData: FormData) {
  await requireAdmin();
  await createProductService(parseProductFormData(formData));
  refreshCatalog();
  redirect('/products');
}

export async function updateProduct(
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();
  const productUuid = parseProductUuid(formData);
  const result = await updateProductService({
    ...parseProductFormData(formData), productUuid,
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
