import { requireAdmin } from '@/lib/auth/require-admin';
import prisma from '@/lib/prisma';

export async function getAllProductsForAdmin() {
  await requireAdmin();

  return prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function toggleProductActiveForAdmin(
  productUuid: string,
  active: boolean
) {
  await requireAdmin();

  return prisma.product.update({
    where: {
      uuid: productUuid,
    },
    data: {
      active,
    },
  });
}
