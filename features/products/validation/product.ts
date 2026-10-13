import { z } from 'zod';
import { parseDollarsToCents } from '../lib/money';

import {
  isValidSalePrice,
  salePriceCentsSchema,
} from '@/features/products/validation/pricing';

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
      .max(2147483647, 'Price is too large'),

    // Optional sale price. Null means the product is not on sale.
    salePriceCents: salePriceCentsSchema.optional(),
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
    priceCents = parseDollarsToCents(String(formData.get('priceDollars') ?? ''));
    salePriceCents = allowSale && formData.has('salePriceDollars')
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
  const result = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? undefined,
    priceCents,
    salePriceCents,
  });
  if (!result.success) {
    throw new ProductFormValidationError(
      result.error.issues.map((issue) => issue.message).join(' ')
    );
  }
  return result.data;
};
