import { beforeEach, expect, it, vi } from 'vitest';

import {
  getCatalogProducts,
  getCatalogProductBySlug,
  getNewestCatalogProducts,
  updateCatalogProduct,
  deleteCatalogProduct,
} from './products';

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: { product: db },
}));

beforeEach(() => {
  vi.resetAllMocks();
  db.findMany.mockResolvedValue([]);
});

const catalogInclude = {
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
};

it('retrieves catalog products with images and variant pricing', async () => {
  await getCatalogProducts();

  expect(db.findMany).toHaveBeenCalledWith({
    where: {},
    orderBy: { createdAt: 'desc' },
    include: catalogInclude,
  });
});

it('supports search, availability, and sorting', async () => {
  await getCatalogProducts({
    search: 'storm',
    availability: 'sold-out',
    sort: 'price-asc',
  });

  expect(db.findMany).toHaveBeenCalledWith({
    where: {
      OR: [
        {
          name: {
            contains: 'storm',
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: 'storm',
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: catalogInclude,
  });
});

it('looks up products by unique slug', async () => {
  await getCatalogProductBySlug('storm-phaze-ii');

  expect(db.findUnique).toHaveBeenCalledWith({
    where: { slug: 'storm-phaze-ii' },
  });
});

it('retrieves four newest products with images and variants', async () => {
  await getNewestCatalogProducts();

  expect(db.findMany).toHaveBeenCalledWith({
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: catalogInclude,
  });
});

it('updates and deletes products by UUID', async () => {
  const productUuid = '550e8400-e29b-41d4-a716-446655440000';

  await updateCatalogProduct({
    productUuid,
    name: 'New name',
    priceCents: 100,
  });

  expect(db.updateMany).toHaveBeenCalledWith({
    where: { uuid: productUuid },
    data: {
      name: 'New name',
      priceCents: 100,
    },
  });

  await deleteCatalogProduct(productUuid);

  expect(db.deleteMany).toHaveBeenCalledWith({
    where: { uuid: productUuid },
  });
});

it('sorts both ways using parent selling prices, including free sales and legacy overrides', async () => {
  const products = [
    { uuid: 'regular', active: true, priceCents: 1000, salePriceCents: null, variants: [] },
    { uuid: 'sale', active: true, priceCents: 2000, salePriceCents: 500, variants: [{ active: true, stockQuantity: 1, optionValues: { Size: 'M' }, priceCents: 1, salePriceCents: null }] },
    { uuid: 'free', active: true, priceCents: 3000, salePriceCents: 0, variants: [] },
  ];
  db.findMany.mockResolvedValue(products);
  expect((await getCatalogProducts({ sort: 'price-asc' })).map(p => p.uuid)).toEqual(['free', 'sale', 'regular']);
  expect((await getCatalogProducts({ sort: 'price-desc' })).map(p => p.uuid)).toEqual(['regular', 'sale', 'free']);
});

it('filters by usable variant inventory while preserving products without variants', async () => {
  const base = { priceCents: 1000, salePriceCents: null, active: true };
  const variant = { active: true, stockQuantity: 1, optionValues: { Size: 'M' } };
  db.findMany.mockResolvedValue([
    { ...base, uuid: 'simple', variants: [] },
    { ...base, uuid: 'stocked', variants: [variant] },
    { ...base, uuid: 'empty', variants: [{ ...variant, stockQuantity: 0 }] },
    { ...base, uuid: 'inactive-variant', variants: [{ ...variant, active: false }] },
    { ...base, uuid: 'invalid-options', variants: [{ ...variant, optionValues: {} }] },
    { ...base, uuid: 'inactive-product', active: false, variants: [variant] },
  ]);
  expect((await getCatalogProducts({ availability: 'available' })).map(p => p.uuid)).toEqual(['simple', 'stocked']);
  expect((await getCatalogProducts({ availability: 'sold-out' })).map(p => p.uuid)).toEqual(['empty', 'inactive-variant', 'invalid-options', 'inactive-product']);
});
