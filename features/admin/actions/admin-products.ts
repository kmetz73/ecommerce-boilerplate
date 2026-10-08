'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';
import { toggleProductActiveForAdmin } from '@/features/admin/services/admin-products';

const toggleProductActiveSchema = z.object({
  productUuid: z.string().uuid('Invalid product UUID.'),

  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
});


export async function toggleAdminProductActive(formData: FormData) {
  await requireAdmin();

  const result = toggleProductActiveSchema.safeParse({
    productUuid: formData.get('productUuid'),
    active: formData.get('active'),
  });

  if (!result.success) {
    throw new Error('Invalid admin product update.');
  }

  
await toggleProductActiveForAdmin(
  result.data.productUuid,
  result.data.active
);
  revalidatePath('/admin');
  revalidatePath('/products');
  revalidatePath('/products', 'layout');
  revalidatePath('/');
  revalidatePath('/shop');
}
