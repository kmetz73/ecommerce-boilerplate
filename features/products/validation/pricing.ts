import { z } from 'zod';

const MAX_PRICE_CENTS = 2_147_483_647;

// Validate monetary amounts stored as integer cents.
export const priceCentsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_PRICE_CENTS);

// A null sale price means the item is not on sale.
export const salePriceCentsSchema = priceCentsSchema.nullable();

// Shared rule for products and variants.
export function isValidSalePrice(
  regularPriceCents: number,
  salePriceCents: number | null
) {
  return salePriceCents === null || salePriceCents < regularPriceCents;
}

// Validate regular and sale prices together.
export const productPricingSchema = z
  .object({
    priceCents: priceCentsSchema,
    salePriceCents: salePriceCentsSchema,
  })
  .refine(
    ({ priceCents, salePriceCents }) =>
      isValidSalePrice(priceCents, salePriceCents),
    {
      path: ['salePriceCents'],
      message: 'Sale price must be lower than the regular price.',
    }
  );
