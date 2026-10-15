import prisma from '@/lib/prisma';

import { getSelectionKey, validateCartSelection } from '../lib/cart-policy';

import { MAX_CART_ITEM_QUANTITY } from '../validation/cart';

type CartOwner = { userId: number } | { guestTokenHash: string };

type CartMutationResult =
  | { success: true }
  | { success: false; message: string };

function isRetryableError(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if (!('code' in error)) {
    return false;
  }

  return error.code === 'P2034' || error.code === 'P2002';
}

// Retry concurrent transaction conflicts, not validation failures.
async function retryTransaction<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === 2 || !isRetryableError(error)) {
        throw error;
      }
    }
  }

  throw new Error('Cart transaction could not complete.');
}

// Read cart contents with product images and inventory details.
export async function getCartByOwner(where: CartOwner) {
  return prisma.cart.findUnique({
    where,
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  altText: true,
                },
              },
              variants: {
                select: {
                  uuid: true,
                  productUuid: true,
                  active: true,
                  stockQuantity: true,
                  optionValues: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getOrCreateUserCart(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getOrCreateGuestCart(guestTokenHash: string) {
  return prisma.cart.upsert({
    where: { guestTokenHash },
    update: {},
    create: { guestTokenHash },
  });
}

// Merge guest cart items into the signed-in user's cart.
export async function mergeGuestIntoUserCart(
  userId: number,
  guestTokenHash: string
) {
  return retryTransaction(() =>
    prisma.$transaction(
      async (tx) => {
        const userCart = await tx.cart.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        const guestCart = await tx.cart.findUnique({
          where: { guestTokenHash },
          include: { items: true },
        });

        if (!guestCart || guestCart.uuid === userCart.uuid) {
          return userCart.uuid;
        }

        for (const item of guestCart.items) {
          const key = {
            cartUuid: userCart.uuid,
            selectionKey: item.selectionKey,
          };

          const existing = await tx.cartItem.findUnique({
            where: { cartUuid_selectionKey: key },
          });

          const quantity = Math.min(
            MAX_CART_ITEM_QUANTITY,
            (existing?.quantity ?? 0) + item.quantity
          );

          await tx.cartItem.upsert({
            where: { cartUuid_selectionKey: key },
            update: { quantity },
            create: {
              cartUuid: userCart.uuid,
              productUuid: item.productUuid,
              variantUuid: item.variantUuid,
              selectionKey: item.selectionKey,
              quantity,
            },
          });
        }

        // Delete only after merging succeeds.
        await tx.cart.delete({
          where: { uuid: guestCart.uuid },
        });

        return userCart.uuid;
      },
      { isolationLevel: 'Serializable' }
    )
  );
}

// Add an item or increment its existing quantity.
export async function addCartSelection(input: {
  cartUuid: string;
  productUuid: string;
  variantUuid: string | null;
  quantity: number;
}): Promise<CartMutationResult> {
  return retryTransaction(() =>
    prisma.$transaction(
      async (tx): Promise<CartMutationResult> => {
        const product = await tx.product.findUnique({
          where: { uuid: input.productUuid },
          include: {
            variants: {
              select: {
                uuid: true,
                productUuid: true,
                active: true,
                stockQuantity: true,
                optionValues: true,
              },
            },
          },
        });

        const selectionKey = getSelectionKey(
          input.productUuid,
          input.variantUuid
        );

        const where = {
          cartUuid_selectionKey: {
            cartUuid: input.cartUuid,
            selectionKey,
          },
        };

        const existing = await tx.cartItem.findUnique({
          where,
        });

        const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

        const validation = validateCartSelection(
          product,
          input.variantUuid,
          nextQuantity
        );

        if (!validation.success) {
          return validation;
        }

        if (existing) {
          await tx.cartItem.update({
            where,
            data: { quantity: nextQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartUuid: input.cartUuid,
              productUuid: input.productUuid,
              variantUuid: input.variantUuid,
              selectionKey,
              quantity: nextQuantity,
            },
          });
        }

        return { success: true };
      },
      { isolationLevel: 'Serializable' }
    )
  );
}

// Replace an item's quantity, checking ownership and stock.
export async function setCartSelectionQuantity(input: {
  cartUuid: string;
  itemUuid: string;
  quantity: number;
}): Promise<CartMutationResult> {
  return retryTransaction(() =>
    prisma.$transaction(
      async (tx): Promise<CartMutationResult> => {
        const item = await tx.cartItem.findFirst({
          where: {
            uuid: input.itemUuid,
            cartUuid: input.cartUuid,
          },
        });

        if (!item) {
          return {
            success: false,
            message: 'Cart item not found.',
          };
        }

        const product = await tx.product.findUnique({
          where: { uuid: item.productUuid },
          include: {
            variants: {
              select: {
                uuid: true,
                productUuid: true,
                active: true,
                stockQuantity: true,
                optionValues: true,
              },
            },
          },
        });

        const validation = validateCartSelection(
          product,
          item.variantUuid,
          input.quantity
        );

        if (!validation.success) {
          return validation;
        }

        await tx.cartItem.updateMany({
          where: {
            uuid: item.uuid,
            cartUuid: input.cartUuid,
          },
          data: { quantity: input.quantity },
        });

        return { success: true };
      },
      { isolationLevel: 'Serializable' }
    )
  );
}

// Removal is always scoped to the authenticated/guest cart.
export async function removeCartSelection(input: {
  cartUuid: string;
  itemUuid: string;
}): Promise<CartMutationResult> {
  const result = await prisma.cartItem.deleteMany({
    where: {
      uuid: input.itemUuid,
      cartUuid: input.cartUuid,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: 'Cart item not found.',
    };
  }

  return { success: true };
}
