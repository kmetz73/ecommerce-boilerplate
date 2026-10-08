import { z } from 'zod';

export const productSchema = z.object({
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
});

export const catalogProductLookupSchema = z
  .object({
    productUuid: z.string().uuid('Product UUID must be valid'),
  })
  .strict();

export type ProductInput = z.infer<typeof productSchema>;

export const parseProductFormData = (formData: FormData) => {
  const result = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    priceCents: typeof formData.get('priceCents') === 'string' && String(formData.get('priceCents')).trim() !== ''
      ? Number(formData.get('priceCents')) : Number.NaN,
  });

  if (!result.success) {
    throw new Error('Invalid product data');
  }

  return result.data;
};
