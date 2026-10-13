import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';

import {
  createCatalogProductVariant,
  deleteCatalogProductVariant,
  getProductVariantBySku,
  getProductVariants,
  getVariantProduct,
  updateCatalogProductVariant,
} from '@/features/products/data/product-variants';

import {
  productVariantSchema,
  updateProductVariantSchema,
  type ProductVariantInput,
  type UpdateProductVariantInput,
} from '@/features/products/validation/product-variants';

// Normalize option combinations for comparison.
// Example: Color=Blue, Size=10 matches Size=10, Color=Blue.
function normalizeOptionValues(options: Record<string, string>) {
  const entries = Object.entries(options)
    .map(
      ([name, value]) =>
        [name.trim().toLowerCase(), value.trim().toLowerCase()] as const
    )
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

  return JSON.stringify(entries);
}

export async function createProductVariant(input: ProductVariantInput) {
  // 1. Only administrators may create variants.
  await requireAdmin();

  // 2. Validate the submitted information.
  const validated = productVariantSchema.parse(input);

  // 3. Verify that the parent product exists.
  const product = await getVariantProduct(validated.productUuid);

  if (!product) {
    throw new Error('Product not found.');
  }

  // 4. Check whether the SKU is already in use.
  const existingSku = await getProductVariantBySku(validated.sku);

  if (existingSku) {
    throw new Error('This SKU is already in use.');
  }

  // 5. Retrieve existing variants for this product.
  const existingVariants = await getProductVariants(validated.productUuid);

  const newOptionsKey = normalizeOptionValues(validated.optionValues);

  // 6. Prevent duplicate option combinations.
  const duplicateExists = existingVariants.some((variant) => {
    const parsedOptions = productVariantSchema.shape.optionValues.safeParse(
      variant.optionValues
    );

    if (!parsedOptions.success) {
      return false;
    }

    return normalizeOptionValues(parsedOptions.data) === newOptionsKey;
  });

  if (duplicateExists) {
    throw new Error('A variant with these options already exists.');
  }

  // 7. Create the variant in PostgreSQL.
  return createCatalogProductVariant(validated);
}
// Update an existing product variant.
export async function updateProductVariant(input: UpdateProductVariantInput) {
  // 1. Only administrators can update variants.
  await requireAdmin();

  // 2. Validate the submitted information.
  const validated = updateProductVariantSchema.parse(input);

  // 3. Verify that the variant belongs to this product.
  const variants = await getProductVariants(validated.productUuid);

  const existingVariant = variants.find(
    (variant) => variant.uuid === validated.variantUuid
  );

  if (!existingVariant) {
    throw new Error('Variant not found for this product.');
  }

  // 4. Update the allowed fields in PostgreSQL.
  return updateCatalogProductVariant(validated);
}

// Delete a product variant.
export async function deleteProductVariant(input: {
  productUuid: string;
  variantUuid: string;
}) {
  // 1. Only administrators may delete variants.
  await requireAdmin();

  // 2. Validate the submitted UUIDs.
  const validated = z
    .object({
      productUuid: z.string().uuid(),
      variantUuid: z.string().uuid(),
    })
    .parse(input);

  // 3. Verify the variant belongs to this product.
  const variants = await getProductVariants(
    validated.productUuid
  );

  const existingVariant = variants.find(
    (variant) => variant.uuid === validated.variantUuid
  );

  if (!existingVariant) {
    throw new Error('Variant not found for this product.');
  }

  // 4. Delete the matching variant from PostgreSQL.
  return deleteCatalogProductVariant(validated);
}
