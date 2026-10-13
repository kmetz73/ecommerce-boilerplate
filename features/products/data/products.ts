import { getCatalogPricing } from '../lib/catalog-pricing';
import prisma from '@/lib/prisma';

import type { ProductInput } from '@/features/products/validation/product';

export type CatalogFilters = {
  search?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name';
  availability?: 'available' | 'sold-out';
};

// Retrieve products for the catalog page.
export async function getCatalogProducts(filters: CatalogFilters = {}) {
  const { search, sort = 'newest', availability } = filters;

  const products = await prisma.product.findMany({
    where: {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },

    orderBy: sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },

    include: {
      // Primary product image.
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          altText: true,
        },
      },

      // Variant information for catalog pricing.
      variants: {
        select: {
          optionValues: true,
          priceCents: true,
          salePriceCents: true,
          stockQuantity: true,
          active: true,
        },
      },
    },
  });
  // All matching products are already loaded; sort/filter their displayed values.
  const summaries = products.map((product) => ({
    product,
    pricing: getCatalogPricing(product, product.variants),
  }));
  const eligible = summaries.filter(({ pricing }) =>
    !availability || pricing.isAvailable === (availability === 'available')
  );
  if (sort === 'price-asc' || sort === 'price-desc') {
    const direction = sort === 'price-asc' ? 1 : -1;
    eligible.sort((a, b) =>
      (a.pricing.displayPriceCents - b.pricing.displayPriceCents) * direction
    );
  }
  return eligible.map(({ product }) => product);
}

// Look up a product by UUID.
export async function getCatalogProductByUuid(productUuid: string) {
  return prisma.product.findUnique({
    where: {
      uuid: productUuid,
    },
  });
}

// Look up a public product by slug.
export async function getCatalogProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
  });
}

// Retrieve newest products for the shop homepage.
export async function getNewestCatalogProducts(limit = 4) {
  return prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },

    take: limit,

    include: {
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          altText: true,
        },
      },

      variants: {
        select: {
          optionValues: true,
          priceCents: true,
          salePriceCents: true,
          stockQuantity: true,
          active: true,
        },
      },
    },
  });
}

// Create a product.
export async function createCatalogProduct(
  input: ProductInput & {
    createdById: number;
    slug: string;
  }
) {
  const { createdById, slug, ...product } = input;

  return prisma.product.create({
    data: {
      ...product,
      ownerId: createdById,
      slug,
    },
  });
}

// Update a product by UUID.
export async function updateCatalogProduct(
  input: ProductInput & {
    productUuid: string;
  }
) {
  const { productUuid, ...data } = input;

  return prisma.product.updateMany({
    where: {
      uuid: productUuid,
    },
    data,
  });
}

// Delete a product by UUID.
export async function deleteCatalogProduct(productUuid: string) {
  return prisma.product.deleteMany({
    where: {
      uuid: productUuid,
    },
  });
}
