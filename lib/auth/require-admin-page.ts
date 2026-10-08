import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';

export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/unauthorized');
    }

    throw error;
  }
}
