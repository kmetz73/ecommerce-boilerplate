import prisma from '@/lib/prisma';

import type { ProductVariantInput } from '@/features/products/validation/product-variants';

// Retrieve all variants belonging to a product.
export async function getProductVariants(productUuid: string) {
  return prisma.productVariant.findMany({
    where: {
      productUuid,
    },
    orderBy: [{ createdAt: 'asc' }, { sku: 'asc' }],
    select: {
      uuid: true,
      productUuid: true,
      sku: true,
      optionValues: true,
      priceCents: true,
      salePriceCents: true,
      stockQuantity: true,
      active: true,
    },
  });
}

// Create a product variant in PostgreSQL.
export async function createCatalogProductVariant(input: ProductVariantInput) {
  return prisma.productVariant.create({
    data: {
      productUuid: input.productUuid,
      sku: input.sku,
      optionValues: input.optionValues,
      stockQuantity: input.stockQuantity,
      active: input.active,
    },
  });
}

// Verify that the parent product exists before creating a variant.
export async function getVariantProduct(productUuid: string) {
  return prisma.product.findUnique({
    where: {
      uuid: productUuid,
    },
    select: {
      uuid: true,
      priceCents: true,
      salePriceCents: true,
    },
  });
}

// Look up an existing variant by its unique SKU.
export async function getProductVariantBySku(sku: string) {
  return prisma.productVariant.findUnique({
    where: {
      sku,
    },
    select: {
      uuid: true,
    },
  });
}

// Data accepted when updating a product variant.
type UpdateCatalogProductVariantInput = {
  productUuid: string;
  variantUuid: string;
  stockQuantity: number;
  active: boolean;
};

// Update an existing variant in PostgreSQL.
export async function updateCatalogProductVariant(
  input: UpdateCatalogProductVariantInput
) {
  return prisma.productVariant.update({
    where: {
      uuid: input.variantUuid,
      productUuid: input.productUuid,
    },
    data: {
      stockQuantity: input.stockQuantity,
      active: input.active,
    },
  });
}

// Data required to delete a variant.
type DeleteCatalogProductVariantInput = {
  productUuid: string;
  variantUuid: string;
};

// Delete a variant belonging to a specific product.
export async function deleteCatalogProductVariant(
  input: DeleteCatalogProductVariantInput
) {
  return prisma.productVariant.delete({
    where: {
      uuid: input.variantUuid,
      productUuid: input.productUuid,
    },
    select: {
      uuid: true,
      sku: true,
    },
  });
}
