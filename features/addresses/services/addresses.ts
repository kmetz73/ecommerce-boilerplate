import { getCurrentDbUser } from '@/lib/auth/current-user';

import {
  getAddressesForUser,
  getAddressForUser,
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
  setDefaultAddressForUser,
} from '@/features/addresses/data/addresses';

import {
  addressUuidSchema,
  customerAddressSchema,
  type CustomerAddressInput,
} from '@/features/addresses/validation/addresses';

// Never accept a user ID from the browser.
async function requireAddressUserId() {
  const user = await getCurrentDbUser();

  if (!user) {
    throw new Error('Sign in is required.');
  }

  return user.id;
}

export async function getMyAddresses() {
  const userId = await requireAddressUserId();

  return getAddressesForUser(userId);
}

export async function getMyAddress(addressUuid: string) {
  const userId = await requireAddressUserId();

  const uuid = addressUuidSchema.parse(addressUuid);

  return getAddressForUser(userId, uuid);
}

export async function createMyAddress(
  input: CustomerAddressInput,
  makeDefault = false
) {
  const userId = await requireAddressUserId();

  const validated = customerAddressSchema.parse(input);

  return createAddressForUser(userId, validated, makeDefault);
}

export async function updateMyAddress(
  addressUuid: string,
  input: CustomerAddressInput
) {
  const userId = await requireAddressUserId();

  const uuid = addressUuidSchema.parse(addressUuid);
  const validated = customerAddressSchema.parse(input);

  const updated = await updateAddressForUser(userId, uuid, validated);

  if (!updated) {
    throw new Error('Address not found.');
  }
}

export async function deleteMyAddress(addressUuid: string) {
  const userId = await requireAddressUserId();

  const uuid = addressUuidSchema.parse(addressUuid);

  const deleted = await deleteAddressForUser(userId, uuid);

  if (!deleted) {
    throw new Error('Address not found.');
  }
}

export async function makeMyAddressDefault(addressUuid: string) {
  const userId = await requireAddressUserId();

  const uuid = addressUuidSchema.parse(addressUuid);

  const updated = await setDefaultAddressForUser(userId, uuid);

  if (!updated) {
    throw new Error('Address not found.');
  }
}
