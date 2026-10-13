import { z } from 'zod';

const variantOptionsSchema = z
  .record(z.string(), z.string().trim().min(1))
  .refine(
    (options) => Object.keys(options).length > 0,
    'At least one product option is required.'
  )
  .refine(
    (options) => Object.keys(options).every((key) => key.trim().length > 0),
    'Option names cannot be empty.'
  );

export const productVariantSchema = z.object({
  productUuid: z.string().uuid(),

  sku: z.string().trim().min(1).max(64),

  optionValues: variantOptionsSchema,

  stockQuantity: z.number().int().nonnegative().max(2147483647),

  active: z.boolean().default(true),
});

export const updateProductVariantSchema = z.object({
  productUuid: z.string().uuid(),
  variantUuid: z.string().uuid(),

  stockQuantity: z.number().int().nonnegative().max(2147483647),

  active: z.boolean(),
});

export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;

export type ProductVariantInput = z.infer<typeof productVariantSchema>;
