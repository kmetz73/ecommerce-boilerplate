import { getCurrentDbUser } from '@/lib/auth/current-user';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  createCatalogProduct,
  deleteCatalogProduct, 
  getCatalogProductBySlug,
  getCatalogProducts,
  updateCatalogProduct,
  type CatalogFilters,
  getNewestCatalogProducts,
} from '@/features/products/data/products';
import type { ProductInput } from '@/features/products/validation/product';

export async function getCatalogAccess() {
  const user = await getCurrentDbUser();

  return {
    canManage: user?.role === 'ADMIN',
  };
}

export async function getPublicCatalogProductBySlug(slug: string) {
  return getCatalogProductBySlug(slug);
}

export async function getCatalogForViewer(filters: CatalogFilters = {}) {
  const { canManage } = await getCatalogAccess();

  const products = await getCatalogProducts(filters);

  return {
    products,
    canManage,
  };
}


const slugifyProductName = (name: string) => {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'product';
};

export async function getNewestProducts(limit = 4) {
  return getNewestCatalogProducts(limit);
}

async function createUniqueProductSlug(name: string) {
  const baseSlug = slugifyProductName(name);

  let slug = baseSlug;
  let suffix = 2;

  while (await getCatalogProductBySlug(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createProduct(input: ProductInput) {
  const admin = await requireAdmin();
  const slug = await createUniqueProductSlug(input.name);

  return createCatalogProduct({
    ...input,
    slug,
    createdById: admin.id,
  });
}

export async function updateProduct(
  input: ProductInput & { productUuid: string }
) {
  await requireAdmin();

  const result = await updateCatalogProduct(input);

  if (result.count === 0) {
    return {
      success: false as const,
      message: 'Product not found.',
    };
  }

  return { success: true as const };
}

export async function deleteProduct({ productUuid }: { productUuid: string }) {
  await requireAdmin();

  const result = await deleteCatalogProduct(productUuid);

  if (result.count === 0) {
    throw new Error('Product not found.');
  }

  return result;
}
