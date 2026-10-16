import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMyAddresses,
  createMyAddress,
  deleteMyAddress,
  makeMyAddressDefault,
} from './addresses';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  setDefault: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({
  getCurrentDbUser: mocks.user,
}));

vi.mock('@/features/addresses/data/addresses', () => ({
  getAddressesForUser: mocks.list,
  getAddressForUser: vi.fn(),
  createAddressForUser: mocks.create,
  updateAddressForUser: vi.fn(),
  deleteAddressForUser: mocks.remove,
  setDefaultAddressForUser: mocks.setDefault,
}));

const addressUuid = '550e8400-e29b-41d4-a716-446655440000';

const validAddress = {
  label: 'Home',
  fullName: 'Test Customer',
  line1: '123 Main Street',
  line2: null,
  city: 'Nashville',
  region: 'TN',
  postalCode: '37201',
  countryCode: 'US' as const,
  phone: null,
};

beforeEach(() => {
  vi.resetAllMocks();

  mocks.user.mockResolvedValue({ id: 7 });
  mocks.create.mockResolvedValue({ uuid: addressUuid });
  mocks.remove.mockResolvedValue(true);
  mocks.setDefault.mockResolvedValue(true);
});

describe('customer address services', () => {
  it('requires authentication', async () => {
    mocks.user.mockResolvedValue(null);

    await expect(getMyAddresses()).rejects.toThrow('Sign in is required.');

    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('only retrieves the current users addresses', async () => {
    await getMyAddresses();

    expect(mocks.list).toHaveBeenCalledWith(7);
  });

  it('creates an address for the authenticated user', async () => {
    await createMyAddress(validAddress, true);

    expect(mocks.create).toHaveBeenCalledWith(7, validAddress, true);
  });

  it('rejects invalid address information', async () => {
    await expect(
      createMyAddress({
        ...validAddress,
        postalCode: 'invalid',
      })
    ).rejects.toThrow();

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('scopes deletion to the authenticated user', async () => {
    await deleteMyAddress(addressUuid);

    expect(mocks.remove).toHaveBeenCalledWith(7, addressUuid);
  });

  it('scopes default changes to the authenticated user', async () => {
    await makeMyAddressDefault(addressUuid);

    expect(mocks.setDefault).toHaveBeenCalledWith(7, addressUuid);
  });
});
