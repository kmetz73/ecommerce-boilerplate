import prisma from '@/lib/prisma';
import type { ProductInput } from '@/features/products/validation/product';

export async function getCatalogProducts(filters: CatalogFilters = {}) {
  const { search, sort = 'newest', availability } = filters;

  return prisma.product.findMany({
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

      ...(availability === 'available'
        ? { active: true }
        : availability === 'sold-out'
          ? { active: false }
          : {}),
    },

    orderBy:
      sort === 'price-asc'
        ? { priceCents: 'asc' }
        : sort === 'price-desc'
          ? { priceCents: 'desc' }
          : sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' },
    // NEW: Retrieve the first image for each product.
    include: {
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          altText: true,
        },
      },
    },
  });
}



export async function getCatalogProductByUuid(productUuid: string) {
  return prisma.product.findUnique({
    where: {
      uuid: productUuid,
    },
  });
}

export async function getCatalogProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
  });
}

export type CatalogFilters = {
  search?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name';
  availability?: 'available' | 'sold-out';
};

export async function getNewestCatalogProducts(limit = 4) {
  return prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,

    // Retrieve the primary image for each product.
    include: {
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          altText: true,
        },
      },
    },
  });
}

export async function createCatalogProduct(input: ProductInput & { createdById: number; slug: string }) {
  const { createdById, slug, ...product } = input;
  return prisma.product.create({
    // Retain the existing relation as creator attribution, not an access filter.
    data: { ...product, ownerId: createdById, slug },
  });
}

export async function updateCatalogProduct(
  input: ProductInput & { productUuid: string }
) {
  const { productUuid, ...data } = input;

  return prisma.product.updateMany({
    where: { uuid: productUuid },
    data,
  });
}

export async function deleteCatalogProduct(productUuid: string) {
  return prisma.product.deleteMany({
    where: { uuid: productUuid },
  });
}
