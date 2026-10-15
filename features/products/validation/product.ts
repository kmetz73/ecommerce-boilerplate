import { z } from 'zod';

import { parseDollarsToCents } from '../lib/money';

import {
  isValidSalePrice,
  salePriceCentsSchema,
} from '@/features/products/validation/pricing';

const MAX_INTEGER = 2_147_483_647;

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Product name is required')
      .max(100, 'Product name must be 100 characters or less'),

    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or less')
      .optional(),

    priceCents: z.coerce
      .number()
      .int('Price must be a whole number of cents')
      .min(0, 'Price cannot be negative')
      .max(MAX_INTEGER, 'Price is too large'),

    salePriceCents: salePriceCentsSchema.optional(),

    // null = unlimited / not tracked
    // 0 = sold out
    // positive number = available stock
    stockQuantity: z
      .number()
      .int('Stock must be a whole number')
      .nonnegative('Stock cannot be negative')
      .max(MAX_INTEGER, 'Stock quantity is too large')
      .nullable()
      .optional(),
  })
  .refine(
    ({ priceCents, salePriceCents }) =>
      isValidSalePrice(priceCents, salePriceCents ?? null),
    {
      path: ['salePriceCents'],
      message: 'Sale price must be lower than the regular price.',
    }
  );

export const catalogProductLookupSchema = z
  .object({
    productUuid: z.string().uuid('Product UUID must be valid'),
  })
  .strict();

export type ProductInput = z.infer<typeof productSchema>;

export class ProductFormValidationError extends Error {}

export const parseProductFormData = (formData: FormData, allowSale = true) => {
  let priceCents: number | null;
  let salePriceCents: number | null | undefined;

  try {
    priceCents = parseDollarsToCents(
      String(formData.get('priceDollars') ?? '')
    );

    salePriceCents =
      allowSale && formData.has('salePriceDollars')
        ? parseDollarsToCents(String(formData.get('salePriceDollars') ?? ''))
        : undefined;
  } catch (error) {
    throw new ProductFormValidationError(
      error instanceof Error ? error.message : 'Invalid price.'
    );
  }

  if (priceCents === null) {
    throw new ProductFormValidationError('Regular price is required.');
  }

  // The new inventory forms send this marker.
  // Older callers without inventory fields remain compatible.
  const inventoryConfigured = formData.get('inventoryConfigured') === 'true';

  const inventoryData: {
    stockQuantity?: number | null;
  } = {};

  if (inventoryConfigured) {
    const trackInventory = formData.get('trackInventory') === 'on';

    if (!trackInventory) {
      // Explicitly disable inventory tracking.
      inventoryData.stockQuantity = null;
    } else {
      const raw = formData.get('stockQuantity');

      if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) {
        throw new ProductFormValidationError(
          'Stock must be a nonnegative whole number.'
        );
      }

      const quantity = Number(raw.trim());

      if (!Number.isSafeInteger(quantity) || quantity > MAX_INTEGER) {
        throw new ProductFormValidationError('Stock quantity is too large.');
      }

      inventoryData.stockQuantity = quantity;
    }
  }

  const result = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? undefined,
    priceCents,
    salePriceCents,
    ...inventoryData,
  });

  if (!result.success) {
    throw new ProductFormValidationError(
      result.error.issues.map((issue) => issue.message).join(' ')
    );
  }

  return result.data;
};
