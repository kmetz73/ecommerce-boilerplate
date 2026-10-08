import { getCurrentDbUser } from '@/lib/auth/current-user';

export async function requireAdmin() {
  const user = await getCurrentDbUser();

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  return user;
}
