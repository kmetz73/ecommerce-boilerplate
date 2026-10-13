'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';

import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '@/features/products/services/product-variants';

import {
  productVariantSchema,
  updateProductVariantSchema,
} from '@/features/products/validation/product-variants';

// Shared action response.
type VariantActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export type CreateProductVariantState = VariantActionState;
export type UpdateProductVariantState = VariantActionState;
export type DeleteProductVariantState = VariantActionState;

const MAX_INTEGER = 2_147_483_647;

// Shared error response.
function actionError(message: string): VariantActionState {
  return { status: 'error', message };
}

// Refresh pages affected by variant changes.
function refreshVariantPages() {
  revalidatePath('/products', 'layout');
  revalidatePath('/shop');
  revalidatePath('/');
}

// Shared form values used by create and update.
type ParsedVariantFields =
  | {
      success: true;
      data: {
        stockQuantity: number;
        active: boolean;
      };
    }
  | {
      success: false;
      message: string;
    };

// Parse inventory and active status. Pricing belongs to the product.
function parseVariantFields(formData: FormData): ParsedVariantFields {
  const stock = String(formData.get('stockQuantity') ?? '').trim();

  // Stock must be a nonnegative integer.
  if (!/^\d+$/.test(stock)) {
    return {
      success: false,
      message: 'Stock must be a nonnegative whole number.',
    };
  }

  const stockQuantity = Number(stock);

  if (!Number.isSafeInteger(stockQuantity) || stockQuantity > MAX_INTEGER) {
    return {
      success: false,
      message: 'Stock quantity is too large.',
    };
  }

  return {
    success: true,
    data: { stockQuantity, active: formData.get('active') === 'on' },
  };
}

// Convert known business errors into useful messages.
function getVariantErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const knownErrors = new Set([
    'This SKU is already in use.',
    'A variant with these options already exists.',
    'Product not found.',
    'Variant not found for this product.',
  ]);

  return knownErrors.has(error.message) ? error.message : null;
}

// CREATE VARIANT
export async function createProductVariantAction(
  _previousState: CreateProductVariantState,
  formData: FormData
): Promise<CreateProductVariantState> {
  await requireAdmin();

  const fields = parseVariantFields(formData);

  if (!fields.success) {
    return actionError(fields.message);
  }

  let optionValues: unknown;

  try {
    optionValues = JSON.parse(String(formData.get('optionValues') ?? ''));
  } catch {
    return actionError('Please enter valid product options.');
  }

  const parsed = productVariantSchema.safeParse({
    productUuid: formData.get('productUuid'),
    sku: formData.get('sku'),
    optionValues,
    ...fields.data,
  });

  if (!parsed.success) {
    return actionError(
      'Check the SKU, product options and stock quantity.'
    );
  }

  try {
    const variant = await createProductVariant(parsed.data);

    refreshVariantPages();

    return {
      status: 'success',
      message: `Variant ${variant.sku} created successfully!`,
    };
  } catch (error) {
    const knownMessage = getVariantErrorMessage(error);

    if (knownMessage) {
      return actionError(knownMessage);
    }

    console.error('Variant creation failed:', error);

    return actionError('Unable to create variant. Please try again.');
  }
}

// UPDATE VARIANT
export async function updateProductVariantAction(
  _previousState: UpdateProductVariantState,
  formData: FormData
): Promise<UpdateProductVariantState> {
  await requireAdmin();

  const fields = parseVariantFields(formData);

  if (!fields.success) {
    return actionError(fields.message);
  }

  const parsed = updateProductVariantSchema.safeParse({
    productUuid: formData.get('productUuid'),
    variantUuid: formData.get('variantUuid'),
    ...fields.data,
  });

  if (!parsed.success) {
    return actionError('Check the variant stock and availability.');
  }

  try {
    const variant = await updateProductVariant(parsed.data);

    refreshVariantPages();

    return {
      status: 'success',
      message: `Variant ${variant.sku} updated successfully!`,
    };
  } catch (error) {
    const knownMessage = getVariantErrorMessage(error);

    if (knownMessage) {
      return actionError(knownMessage);
    }

    console.error('Variant update failed:', error);

    return actionError('Unable to update variant. Please try again.');
  }
}

// DELETE VARIANT
export async function deleteProductVariantAction(
  _previousState: DeleteProductVariantState,
  formData: FormData
): Promise<DeleteProductVariantState> {
  await requireAdmin();

  const parsed = z
    .object({
      productUuid: z.string().uuid(),
      variantUuid: z.string().uuid(),
    })
    .safeParse({
      productUuid: formData.get('productUuid'),
      variantUuid: formData.get('variantUuid'),
    });

  if (!parsed.success) {
    return actionError('Invalid product variant selection.');
  }

  try {
    const variant = await deleteProductVariant(parsed.data);

    refreshVariantPages();

    return {
      status: 'success',
      message: `Variant ${variant.sku} deleted successfully!`,
    };
  } catch (error) {
    const knownMessage = getVariantErrorMessage(error);

    if (knownMessage) {
      return actionError(knownMessage);
    }

    console.error('Variant deletion failed:', error);

    return actionError('Unable to delete variant. Please try again.');
  }
}
