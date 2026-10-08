import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllProductsForAdmin, toggleProductActiveForAdmin } from './admin-products';
const mocks = vi.hoisted(() => ({ user: vi.fn(), list: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentDbUser: mocks.user }));
vi.mock('@/lib/prisma', () => ({ default: { product: { findMany: mocks.list, update: mocks.update } } }));
beforeEach(() => vi.resetAllMocks());
describe('admin availability service', () => {
  it.each([null, { id: 42, role: 'USER' }])('rejects non-admin access before database work: %s', async user => {
    mocks.user.mockResolvedValue(user);
    await expect(getAllProductsForAdmin()).rejects.toThrow('Unauthorized');
    await expect(toggleProductActiveForAdmin('550e8400-e29b-41d4-a716-446655440000', false)).rejects.toThrow('Unauthorized');
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('allows an admin to update availability by UUID', async () => {
    mocks.user.mockResolvedValue({ id: 10, role: 'ADMIN' });
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    await toggleProductActiveForAdmin(uuid, false);
    expect(mocks.update).toHaveBeenCalledWith({ where: { uuid }, data: { active: false } });
  });
});
