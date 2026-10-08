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
vi.mock('@/lib/prisma', () => ({ default: { product: db } }));
beforeEach(() => vi.resetAllMocks());

it('queries the whole catalog without owner or availability restrictions', async () => {
  await getCatalogProducts();
  expect(db.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: 'desc' } });
});

it('combines text search, sold-out availability, and price sorting without owner restrictions', async () => {
  await getCatalogProducts({ search: 'storm', availability: 'sold-out', sort: 'price-asc' });
  expect(db.findMany).toHaveBeenCalledWith({
    where: { OR: [{ name: { contains: 'storm', mode: 'insensitive' } }, { description: { contains: 'storm', mode: 'insensitive' } }], active: false },
    orderBy: { priceCents: 'asc' },
  });
});

it('looks up public products by unique slug', async () => {
  await getCatalogProductBySlug('storm-phaze-ii');
  expect(db.findUnique).toHaveBeenCalledWith({ where: { slug: 'storm-phaze-ii' } });
});

it('selects four newest products including sold-out products for the storefront', async () => {
  await getNewestCatalogProducts();
  expect(db.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' }, take: 4 });
});

it('targets products by UUID for guarded global updates and deletions', async () => {
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
