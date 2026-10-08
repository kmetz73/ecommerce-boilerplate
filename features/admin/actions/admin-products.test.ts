import { beforeEach, expect, it, vi } from 'vitest';
import { toggleAdminProductActive } from './admin-products';
const mocks = vi.hoisted(() => ({ guard: vi.fn(), toggle: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/auth/require-admin', () => ({ requireAdmin: mocks.guard }));
vi.mock('@/features/admin/services/admin-products', () => ({ toggleProductActiveForAdmin: mocks.toggle }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }));
beforeEach(() => vi.resetAllMocks());
it('rejects direct unauthorized action calls before invoking the service', async () => {
  mocks.guard.mockRejectedValue(new Error('Unauthorized'));
  await expect(toggleAdminProductActive(new FormData())).rejects.toThrow('Unauthorized');
  expect(mocks.toggle).not.toHaveBeenCalled();
});
it('rejects invalid UUIDs and boolean values before writes', async () => {
  for (const [uuid, active] of [['bad', 'false'], ['550e8400-e29b-41d4-a716-446655440000', 'yes']]) {
    const form = new FormData(); form.set('productUuid', uuid); form.set('active', active);
    await expect(toggleAdminProductActive(form)).rejects.toThrow('Invalid admin product update.');
  }
  expect(mocks.toggle).not.toHaveBeenCalled();
});
it('refreshes storefront, catalog, detail, and admin routes after availability changes', async () => {
  const form = new FormData();
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  form.set('productUuid', uuid); form.set('active', 'false');
  await toggleAdminProductActive(form);
  expect(mocks.toggle).toHaveBeenCalledWith(uuid, false);
  for (const route of ['/', '/shop', '/products', '/admin']) expect(mocks.refresh).toHaveBeenCalledWith(route);
  expect(mocks.refresh).toHaveBeenCalledWith('/products', 'layout');
});
