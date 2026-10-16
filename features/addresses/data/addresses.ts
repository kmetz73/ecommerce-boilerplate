import prisma from '@/lib/prisma';

import type { CustomerAddressInput } from '@/features/addresses/validation/addresses';

// Read only addresses belonging to this customer.
export async function getAddressesForUser(userId: number) {
  return prisma.customerAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
}

// Retrieve one address with an ownership filter.
export async function getAddressForUser(userId: number, addressUuid: string) {
  return prisma.customerAddress.findFirst({
    where: {
      uuid: addressUuid,
      userId,
    },
  });
}

// Create an address and assign a default when appropriate.
export async function createAddressForUser(
  userId: number,
  input: CustomerAddressInput,
  makeDefault: boolean
) {
  return prisma.$transaction(
    async (tx) => {
      const count = await tx.customerAddress.count({
        where: { userId },
      });

      // The customer's first address becomes default.
      const shouldBeDefault = makeDefault || count === 0;

      if (shouldBeDefault) {
        await tx.customerAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          ...input,
          userId,
          isDefault: shouldBeDefault,
        },
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

// Update address information without changing ownership
// or the default-address flag.
export async function updateAddressForUser(
  userId: number,
  addressUuid: string,
  input: CustomerAddressInput
) {
  const result = await prisma.customerAddress.updateMany({
    where: {
      uuid: addressUuid,
      userId,
    },
    data: input,
  });

  return result.count > 0;
}

// Make an existing customer address the default.
export async function setDefaultAddressForUser(
  userId: number,
  addressUuid: string
) {
  return prisma.$transaction(
    async (tx) => {
      const address = await tx.customerAddress.findFirst({
        where: {
          uuid: addressUuid,
          userId,
        },
        select: { uuid: true },
      });

      if (!address) return false;

      await tx.customerAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      await tx.customerAddress.updateMany({
        where: {
          uuid: addressUuid,
          userId,
        },
        data: { isDefault: true },
      });

      return true;
    },
    { isolationLevel: 'Serializable' }
  );
}

// Delete an owned address and promote another if needed.
export async function deleteAddressForUser(
  userId: number,
  addressUuid: string
) {
  return prisma.$transaction(
    async (tx) => {
      const address = await tx.customerAddress.findFirst({
        where: {
          uuid: addressUuid,
          userId,
        },
        select: {
          uuid: true,
          isDefault: true,
        },
      });

      if (!address) return false;

      await tx.customerAddress.deleteMany({
        where: {
          uuid: addressUuid,
          userId,
        },
      });

      // If the deleted address was the default,
      // choose the oldest remaining address.
      if (address.isDefault) {
        const replacement = await tx.customerAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          select: { uuid: true },
        });

        if (replacement) {
          await tx.customerAddress.updateMany({
            where: {
              uuid: replacement.uuid,
              userId,
            },
            data: { isDefault: true },
          });
        }
      }

      return true;
    },
    { isolationLevel: 'Serializable' }
  );
}
